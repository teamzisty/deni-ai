import "server-only";

import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

function normalizeIpAddress(address: string) {
  return address.toLowerCase().startsWith("::ffff:") ? address.slice(7) : address;
}

function isPrivateIpv4(address: string) {
  if (address === "127.0.0.1" || address === "0.0.0.0") {
    return true;
  }
  if (
    address.startsWith("10.") ||
    address.startsWith("192.168.") ||
    address.startsWith("169.254.")
  ) {
    return true;
  }

  if (address.startsWith("100.")) {
    const match100 = address.match(/^100\.(\d+)\./);
    if (match100) {
      const second = Number.parseInt(match100[1], 10);
      if (second >= 64 && second <= 127) {
        return true;
      }
    }
  }

  if (address.startsWith("198.")) {
    const match198 = address.match(/^198\.(\d+)\./);
    if (match198) {
      const second = Number.parseInt(match198[1], 10);
      if (second === 18 || second === 19) {
        return true;
      }
    }
  }

  const match172 = address.match(/^172\.(\d+)\./);
  if (match172) {
    const second = Number.parseInt(match172[1], 10);
    if (second >= 16 && second <= 31) {
      return true;
    }
  }

  return address.startsWith("0.") || address.startsWith("224.") || address.startsWith("255.");
}

function isPrivateIpv6(address: string) {
  const normalized = address.toLowerCase();
  return (
    normalized === "::" ||
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe8") ||
    normalized.startsWith("fe9") ||
    normalized.startsWith("fea") ||
    normalized.startsWith("feb") ||
    normalized.startsWith("::ffff:127.") ||
    normalized.startsWith("::ffff:10.") ||
    normalized.startsWith("::ffff:192.168.") ||
    normalized.startsWith("::ffff:169.254.")
  );
}

export function isPrivateIpAddress(address: string) {
  const normalized = normalizeIpAddress(address);
  const version = isIP(normalized);

  if (version === 4) {
    return isPrivateIpv4(normalized);
  }

  if (version === 6) {
    return isPrivateIpv6(normalized);
  }

  return false;
}

export function isBlockedHostnameLiteral(hostname: string) {
  const normalized = hostname.trim().toLowerCase();
  return (
    normalized === "localhost" ||
    normalized.endsWith(".internal") ||
    normalized.endsWith(".local") ||
    isPrivateIpAddress(normalized)
  );
}

export async function normalizePublicBaseUrl(url: string) {
  const trimmed = url.trim().replace(/\/$/, "");
  if (!trimmed) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);

    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return null;
    }

    if (parsed.username || parsed.password) {
      return null;
    }

    if (await resolvesToPrivateNetwork(parsed.hostname)) {
      return null;
    }

    return parsed.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

export async function resolvesToPrivateNetwork(hostname: string) {
  if (isBlockedHostnameLiteral(hostname)) {
    return true;
  }

  try {
    const addresses = await lookup(hostname, { all: true, verbatim: true });
    return addresses.some((entry) => isPrivateIpAddress(entry.address));
  } catch {
    return true;
  }
}

export async function assertSafePublicHttpUrl(url: string) {
  let parsed: URL;

  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Invalid URL");
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("Only HTTP and HTTPS URLs are allowed.");
  }

  if (parsed.username || parsed.password) {
    throw new Error("Credentialed URLs are not allowed.");
  }

  if (await resolvesToPrivateNetwork(parsed.hostname)) {
    throw new Error("Private network URLs are not allowed.");
  }

  return parsed;
}
