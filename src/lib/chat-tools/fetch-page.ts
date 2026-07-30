import { load } from "cheerio";
import { env } from "@/env";
import { assertSafePublicHttpUrl } from "@/lib/network-security";
import { createAbortError } from "./helpers";

export const DEFAULT_PAGE_FETCH_TIMEOUT_MS = 12_000;
export const DEFAULT_BROWSE_MAX_CHARS = 20_000;
export const MIN_BROWSE_MAX_CHARS = 1_000;
export const MAX_BROWSE_MAX_CHARS = 50_000;
/** Cap raw HTML before parsing to avoid pathological pages. */
const MAX_RAW_HTML_CHARS = 2_000_000;
const MAX_REDIRECTS = 5;
const FALLBACK_TIMEOUT_MS = 20_000;

const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

/** Browser-like headers improve success against bot filters vs a custom bot UA. */
const BROWSER_HEADERS: HeadersInit = {
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9,ja;q=0.8",
  "Cache-Control": "no-cache",
  "Upgrade-Insecure-Requests": "1",
  "User-Agent": BROWSER_USER_AGENT,
};

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

export type PageFetchSource = "direct" | "archive" | "reader" | "search-snippet";

export type FetchedPageText = {
  url: string;
  title: string;
  content: string;
  truncated: boolean;
  contentLength: number;
  /** How the page text was obtained. */
  source: PageFetchSource;
};

function clampMaxChars(maxChars?: number) {
  return Math.min(
    Math.max(maxChars ?? DEFAULT_BROWSE_MAX_CHARS, MIN_BROWSE_MAX_CHARS),
    MAX_BROWSE_MAX_CHARS,
  );
}

function isAbortError(error: unknown) {
  return (
    (error instanceof Error && error.name === "AbortError") ||
    (typeof DOMException !== "undefined" &&
      error instanceof DOMException &&
      error.name === "AbortError")
  );
}

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw createAbortError();
  }
}

function statusErrorMessage(status: number) {
  switch (status) {
    case 401:
      return "Page requires authentication (401).";
    case 403:
      return "Page blocked the request (403). The site may reject automated access.";
    case 404:
      return "Page not found (404).";
    case 429:
      return "Page rate-limited the request (429).";
    default:
      return `Failed to fetch page (${status}).`;
  }
}

function looksLikeBlockedOrEmptyPage(title: string, content: string) {
  const normalizedTitle = title.toLowerCase();
  const normalizedContent = content.toLowerCase();
  const blockedMarkers = [
    "access denied",
    "just a moment",
    "attention required",
    "cf-browser-verification",
    "enable javascript and cookies",
    "checking your browser",
    "verify you are human",
    "request blocked",
    "forbidden",
  ];

  if (!content || content.length < 80) {
    return true;
  }

  return blockedMarkers.some(
    (marker) => normalizedTitle.includes(marker) || normalizedContent.includes(marker),
  );
}

function extractReadableText(html: string, maxChars: number, fallbackTitle: string) {
  const $ = load(html.slice(0, MAX_RAW_HTML_CHARS));
  $("script, style, noscript, iframe, svg, canvas, template").remove();
  // Wayback UI chrome
  $("#wm-ipp-base, #wm-ipp, #donato, #wm-capinfo").remove();
  $("nav, footer, header, aside").remove();

  const title =
    $("title").first().text().replace(/\s+/g, " ").trim() ||
    $('meta[property="og:title"]').attr("content")?.replace(/\s+/g, " ").trim() ||
    fallbackTitle;

  const mainText = (
    $("article").text() ||
    $("main").text() ||
    $('[role="main"]').text() ||
    $("body").text()
  )
    .replace(/\s+/g, " ")
    .trim();

  const metaDescription =
    $('meta[name="description"]').attr("content")?.replace(/\s+/g, " ").trim() ||
    $('meta[property="og:description"]').attr("content")?.replace(/\s+/g, " ").trim() ||
    "";

  const bodyText =
    mainText.length >= 80 ? mainText : [metaDescription, mainText].filter(Boolean).join(" ").trim();

  const contentLength = bodyText.length;
  const truncated = contentLength > maxChars;

  return {
    title,
    content: bodyText.slice(0, maxChars),
    truncated,
    contentLength,
  };
}

function parseJinaReaderText(
  raw: string,
  maxChars: number,
  fallbackTitle: string,
): { title: string; content: string; truncated: boolean; contentLength: number } {
  const lines = raw.replace(/\r\n?/g, "\n").split("\n");
  let title = fallbackTitle;
  let contentStart = 0;

  for (let i = 0; i < Math.min(lines.length, 40); i++) {
    const line = lines[i] ?? "";
    if (line.startsWith("Title:")) {
      title = line.slice("Title:".length).trim() || title;
      continue;
    }
    if (line.startsWith("Markdown Content:")) {
      contentStart = i + 1;
      break;
    }
  }

  const content = lines
    .slice(contentStart)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  const contentLength = content.length;
  const truncated = contentLength > maxChars;

  return {
    title,
    content: content.slice(0, maxChars),
    truncated,
    contentLength,
  };
}

async function withTimeoutSignal<T>(
  timeoutMs: number,
  parent: AbortSignal | undefined,
  run: (signal: AbortSignal) => Promise<T>,
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const onAbort = () => controller.abort();
  parent?.addEventListener("abort", onAbort);

  try {
    throwIfAborted(parent);
    return await run(controller.signal);
  } finally {
    clearTimeout(timeoutId);
    parent?.removeEventListener("abort", onAbort);
  }
}

function isAllowedArchiveHost(hostname: string) {
  const normalized = hostname.toLowerCase();
  return (
    normalized === "archive.org" ||
    normalized.endsWith(".archive.org") ||
    normalized === "web.archive.org"
  );
}

/**
 * Follow redirects manually and re-validate each hop.
 * When `hostAllowlist` is set, only those hosts (plus already-validated start host) are allowed.
 */
async function fetchWithSafeRedirects(
  url: string,
  signal: AbortSignal,
  options?: {
    /** Extra hosts allowed for redirect hops (e.g. web.archive.org). */
    allowArchiveHosts?: boolean;
  },
): Promise<{ response: Response; finalUrl: string; finalHostname: string }> {
  let current = await assertSafePublicHttpUrl(url);
  const startHost = current.hostname.toLowerCase();

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const response = await fetch(current.toString(), {
      headers: BROWSER_HEADERS,
      signal,
      redirect: "manual",
    });

    if (REDIRECT_STATUSES.has(response.status)) {
      const location = response.headers.get("location");
      void response.arrayBuffer().catch(() => undefined);

      if (!location) {
        throw new Error(`Redirect without Location header (${response.status}).`);
      }

      let next: URL;
      try {
        next = new URL(location, current);
      } catch {
        throw new Error("Invalid redirect Location header.");
      }

      const nextHost = next.hostname.toLowerCase();
      const allowedArchiveHop = options?.allowArchiveHosts && isAllowedArchiveHost(nextHost);
      if (nextHost !== startHost && !allowedArchiveHop) {
        // Re-validate arbitrary public redirects.
        current = await assertSafePublicHttpUrl(next.toString());
      } else if (allowedArchiveHop) {
        if (next.protocol !== "https:" && next.protocol !== "http:") {
          throw new Error("Invalid archive redirect protocol.");
        }
        current = next;
      } else {
        current = await assertSafePublicHttpUrl(next.toString());
      }
      continue;
    }

    return {
      response,
      finalUrl: current.toString(),
      finalHostname: current.hostname,
    };
  }

  throw new Error("Too many redirects while opening the page.");
}

async function parseSuccessfulResponse(
  response: Response,
  finalUrl: string,
  finalHostname: string,
  maxChars: number,
  source: PageFetchSource,
): Promise<FetchedPageText> {
  if (!response.ok) {
    throw new Error(statusErrorMessage(response.status));
  }

  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  const isTextLike =
    contentType.length === 0 ||
    contentType.includes("text/") ||
    contentType.includes("html") ||
    contentType.includes("xml") ||
    contentType.includes("json") ||
    contentType.includes("javascript") ||
    contentType.includes("markdown");

  if (!isTextLike) {
    throw new Error(`Unsupported content type: ${contentType || "unknown"}`);
  }

  const raw = await response.text();

  if (
    contentType.includes("text/plain") ||
    contentType.includes("json") ||
    contentType.includes("markdown")
  ) {
    // Reader markdown keeps newlines useful; plain text can collapse lightly.
    const normalized = contentType.includes("markdown")
      ? raw.replace(/\n{3,}/g, "\n\n").trim()
      : raw.replace(/\s+/g, " ").trim();

    if (looksLikeBlockedOrEmptyPage(finalHostname, normalized)) {
      throw new Error("Page returned no useful text content.");
    }

    return {
      url: finalUrl,
      title: finalHostname,
      content: normalized.slice(0, maxChars),
      truncated: normalized.length > maxChars,
      contentLength: normalized.length,
      source,
    };
  }

  const extracted = extractReadableText(raw, maxChars, finalHostname);
  if (looksLikeBlockedOrEmptyPage(extracted.title, extracted.content)) {
    throw new Error("Page returned a challenge or empty body.");
  }

  return {
    url: finalUrl,
    title: extracted.title || finalHostname,
    content: extracted.content,
    truncated: extracted.truncated,
    contentLength: extracted.contentLength,
    source,
  };
}

async function fetchDirect(
  url: string,
  maxChars: number,
  signal: AbortSignal,
): Promise<FetchedPageText> {
  const { response, finalUrl, finalHostname } = await fetchWithSafeRedirects(url, signal);
  return parseSuccessfulResponse(response, finalUrl, finalHostname, maxChars, "direct");
}

async function fetchViaArchive(
  url: string,
  maxChars: number,
  signal: AbortSignal,
): Promise<FetchedPageText> {
  const target = await assertSafePublicHttpUrl(url);
  const availabilityUrl = `https://archive.org/wayback/available?url=${encodeURIComponent(target.toString())}`;

  const availabilityResponse = await fetch(availabilityUrl, {
    headers: {
      Accept: "application/json",
      "User-Agent": BROWSER_USER_AGENT,
    },
    signal,
    redirect: "error",
  });

  if (!availabilityResponse.ok) {
    throw new Error(`Archive lookup failed (${availabilityResponse.status}).`);
  }

  const availability = (await availabilityResponse.json()) as {
    archived_snapshots?: {
      closest?: {
        available?: boolean;
        url?: string;
        status?: string;
      };
    };
  };

  const snapshot = availability.archived_snapshots?.closest;
  if (!snapshot?.available || !snapshot.url) {
    throw new Error("No archived snapshot available for this URL.");
  }

  let snapshotUrl: URL;
  try {
    snapshotUrl = new URL(snapshot.url);
  } catch {
    throw new Error("Invalid archive snapshot URL.");
  }

  if (!isAllowedArchiveHost(snapshotUrl.hostname)) {
    throw new Error("Archive snapshot host is not allowed.");
  }

  // Prefer HTTPS for archive fetches.
  if (snapshotUrl.protocol === "http:") {
    snapshotUrl.protocol = "https:";
  }

  const { response, finalHostname } = await fetchWithSafeRedirects(snapshotUrl.toString(), signal, {
    allowArchiveHosts: true,
  });

  const page = await parseSuccessfulResponse(
    response,
    target.toString(),
    target.hostname,
    maxChars,
    "archive",
  );

  // Prefer original hostname for title fallback when archive title is noisy.
  if (!page.title || page.title === finalHostname || /wayback machine/i.test(page.title)) {
    return { ...page, title: target.hostname };
  }

  return page;
}

async function fetchViaReader(
  url: string,
  maxChars: number,
  signal: AbortSignal,
): Promise<FetchedPageText> {
  const parsed = await assertSafePublicHttpUrl(url);
  const requestUrl = parsed.toString();
  const readerUrl = `https://r.jina.ai/${requestUrl}`;

  const response = await fetch(readerUrl, {
    headers: {
      Accept: "text/plain,text/markdown,*/*;q=0.8",
      "User-Agent": BROWSER_USER_AGENT,
      "X-Return-Format": "markdown",
    },
    signal,
    redirect: "error",
  });

  if (!response.ok) {
    throw new Error(`Reader fallback failed (${response.status}).`);
  }

  const raw = await response.text();
  if (looksLikeBlockedOrEmptyPage("reader", raw) || raw.includes("Just a moment...")) {
    throw new Error("Reader fallback returned a challenge page.");
  }

  const extracted = parseJinaReaderText(raw, maxChars, parsed.hostname);
  if (!extracted.content || extracted.contentLength < 40) {
    throw new Error("Reader fallback returned no readable content.");
  }

  return {
    url: requestUrl,
    title: extracted.title,
    content: extracted.content,
    truncated: extracted.truncated,
    contentLength: extracted.contentLength,
    source: "reader",
  };
}

async function fetchViaBraveSnippet(
  url: string,
  maxChars: number,
  signal: AbortSignal,
): Promise<FetchedPageText> {
  const target = await assertSafePublicHttpUrl(url);
  const apiKey = env.BRAVE_SEARCH_API_KEY;
  if (!apiKey) {
    throw new Error("Brave Search API key not configured.");
  }

  const params = new URLSearchParams({
    q: target.toString(),
    count: "8",
  });

  const response = await fetch(`https://api.search.brave.com/res/v1/web/search?${params}`, {
    headers: {
      Accept: "application/json",
      "Accept-Encoding": "gzip",
      "X-Subscription-Token": apiKey,
    },
    signal,
  });

  if (!response.ok) {
    throw new Error(`Search snippet fallback failed (${response.status}).`);
  }

  const data = (await response.json()) as {
    web?: {
      results?: Array<{ title?: string; url?: string; description?: string }>;
    };
  };

  const results = data.web?.results ?? [];
  const targetHref = target.toString().replace(/\/$/, "");
  const targetHost = target.hostname.toLowerCase();

  const exact =
    results.find((item) => {
      if (!item.url) return false;
      try {
        return new URL(item.url).toString().replace(/\/$/, "") === targetHref;
      } catch {
        return false;
      }
    }) ??
    results.find((item) => {
      if (!item.url) return false;
      try {
        return new URL(item.url).hostname.toLowerCase() === targetHost;
      } catch {
        return false;
      }
    });

  if (!exact?.description) {
    throw new Error("No search snippet available for this URL.");
  }

  const title = exact.title?.trim() || target.hostname;
  const content =
    `Title: ${title}\nURL: ${exact.url ?? target.toString()}\n\n${exact.description.trim()}`.slice(
      0,
      maxChars,
    );

  return {
    url: target.toString(),
    title,
    content,
    truncated: false,
    contentLength: content.length,
    source: "search-snippet",
  };
}

/**
 * Fetch a public HTTP(S) page and return cleaned text content for agent tools.
 * Blocks private/local network targets and re-validates every redirect hop.
 * Falls back through archive / reader / search snippet when sites block direct access.
 */
export async function fetchPageText(
  url: string,
  options?: {
    maxChars?: number;
    timeoutMs?: number;
    signal?: AbortSignal;
    /**
     * When false, only attempt a direct fetch (used by search summarization for speed).
     * Browse uses full fallbacks by default.
     */
    allowReaderFallback?: boolean;
  },
): Promise<FetchedPageText> {
  const maxChars = clampMaxChars(options?.maxChars);
  const timeoutMs = options?.timeoutMs ?? DEFAULT_PAGE_FETCH_TIMEOUT_MS;
  const allowFallbacks = options?.allowReaderFallback !== false;
  const requestUrl = (await assertSafePublicHttpUrl(url)).toString();

  const errors: string[] = [];

  try {
    return await withTimeoutSignal(timeoutMs, options?.signal, (signal) =>
      fetchDirect(requestUrl, maxChars, signal),
    );
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }
    errors.push(error instanceof Error ? error.message : "Direct fetch failed");
    if (!allowFallbacks) {
      throw error instanceof Error ? error : new Error("Failed to fetch page");
    }
  }

  const fallbackTimeout = Math.max(timeoutMs, FALLBACK_TIMEOUT_MS);

  const fallbacks: Array<{
    name: string;
    run: (signal: AbortSignal) => Promise<FetchedPageText>;
  }> = [
    {
      name: "archive",
      run: (signal) => fetchViaArchive(requestUrl, maxChars, signal),
    },
    {
      name: "reader",
      run: (signal) => fetchViaReader(requestUrl, maxChars, signal),
    },
    {
      name: "search-snippet",
      run: (signal) => fetchViaBraveSnippet(requestUrl, maxChars, signal),
    },
  ];

  for (const fallback of fallbacks) {
    try {
      return await withTimeoutSignal(fallbackTimeout, options?.signal, fallback.run);
    } catch (error) {
      if (isAbortError(error)) {
        throw error;
      }
      errors.push(`${fallback.name}: ${error instanceof Error ? error.message : "failed"}`);
    }
  }

  throw new Error(errors.join(" | "));
}
