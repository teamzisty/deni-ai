import { load } from "cheerio";
import { assertSafePublicHttpUrl } from "@/lib/network-security";
import { createAbortError } from "./helpers";

export const DEFAULT_PAGE_FETCH_TIMEOUT_MS = 10_000;
export const DEFAULT_BROWSE_MAX_CHARS = 20_000;
export const MIN_BROWSE_MAX_CHARS = 1_000;
export const MAX_BROWSE_MAX_CHARS = 50_000;
/** Cap raw HTML before parsing to avoid pathological pages. */
const MAX_RAW_HTML_CHARS = 2_000_000;

export type FetchedPageText = {
  url: string;
  title: string;
  content: string;
  truncated: boolean;
  contentLength: number;
};

function clampMaxChars(maxChars?: number) {
  return Math.min(
    Math.max(maxChars ?? DEFAULT_BROWSE_MAX_CHARS, MIN_BROWSE_MAX_CHARS),
    MAX_BROWSE_MAX_CHARS,
  );
}

function extractReadableText(html: string, maxChars: number) {
  const $ = load(html.slice(0, MAX_RAW_HTML_CHARS));
  $("script, style, noscript, iframe, svg, canvas, template").remove();
  $("nav, footer, header, aside").remove();

  const title = $("title").first().text().replace(/\s+/g, " ").trim();
  const bodyText = $("body").text().replace(/\s+/g, " ").trim();
  const contentLength = bodyText.length;
  const truncated = contentLength > maxChars;

  return {
    title,
    content: bodyText.slice(0, maxChars),
    truncated,
    contentLength,
  };
}

/**
 * Fetch a public HTTP(S) page and return cleaned text content for agent tools.
 * Blocks private/local network targets and does not follow redirects (SSRF safety).
 */
export async function fetchPageText(
  url: string,
  options?: {
    maxChars?: number;
    timeoutMs?: number;
    signal?: AbortSignal;
  },
): Promise<FetchedPageText> {
  const maxChars = clampMaxChars(options?.maxChars);
  const timeoutMs = options?.timeoutMs ?? DEFAULT_PAGE_FETCH_TIMEOUT_MS;
  const parsed = await assertSafePublicHttpUrl(url);
  const requestUrl = parsed.toString();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const onAbort = () => controller.abort();
  options?.signal?.addEventListener("abort", onAbort);

  try {
    if (options?.signal?.aborted) {
      throw createAbortError();
    }

    const response = await fetch(requestUrl, {
      headers: {
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.5",
        "User-Agent": "Mozilla/5.0 (compatible; DeniAI/1.0)",
      },
      signal: controller.signal,
      // Do not follow redirects: a public host can 302 into a private network.
      redirect: "error",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch page (${response.status})`);
    }

    const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
    const isTextLike =
      contentType.length === 0 ||
      contentType.includes("text/") ||
      contentType.includes("html") ||
      contentType.includes("xml") ||
      contentType.includes("json") ||
      contentType.includes("javascript");

    if (!isTextLike) {
      throw new Error(`Unsupported content type: ${contentType || "unknown"}`);
    }

    const raw = await response.text();

    if (contentType.includes("text/plain") || contentType.includes("json")) {
      const normalized = raw.replace(/\s+/g, " ").trim();
      const truncated = normalized.length > maxChars;
      return {
        url: requestUrl,
        title: parsed.hostname,
        content: normalized.slice(0, maxChars),
        truncated,
        contentLength: normalized.length,
      };
    }

    const extracted = extractReadableText(raw, maxChars);
    return {
      url: requestUrl,
      title: extracted.title || parsed.hostname,
      content: extracted.content,
      truncated: extracted.truncated,
      contentLength: extracted.contentLength,
    };
  } finally {
    clearTimeout(timeoutId);
    options?.signal?.removeEventListener("abort", onAbort);
  }
}
