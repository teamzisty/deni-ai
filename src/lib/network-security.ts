import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

function normalizeIpAddress(address: string) {
  return address.toLowerCase().startsWith("::ffff:") ? address.slice(7) : address;
}

/**
 * Non-public IPv4 ranges, as CIDR pairs of [network, prefix length].
 *
 * Matching on numeric ranges rather than string prefixes matters: a
 * `startsWith("127.0.0.1")`-style check only covers a single loopback address and
 * leaves the rest of 127.0.0.0/8 (127.0.0.2, 127.1.1.1, …) reachable.
 */
const PRIVATE_IPV4_CIDRS: ReadonlyArray<readonly [string, number]> = [
  ["0.0.0.0", 8], // "this network"
  ["10.0.0.0", 8], // RFC 1918
  ["100.64.0.0", 10], // RFC 6598 carrier-grade NAT
  ["127.0.0.0", 8], // loopback
  ["169.254.0.0", 16], // link-local, incl. cloud metadata 169.254.169.254
  ["172.16.0.0", 12], // RFC 1918
  ["192.0.0.0", 24], // IETF protocol assignments
  ["192.0.2.0", 24], // TEST-NET-1
  ["192.168.0.0", 16], // RFC 1918
  ["198.18.0.0", 15], // benchmarking
  ["198.51.100.0", 24], // TEST-NET-2
  ["203.0.113.0", 24], // TEST-NET-3
  ["224.0.0.0", 4], // multicast
  ["240.0.0.0", 4], // reserved, incl. 255.255.255.255 broadcast
];

function ipv4ToInt(address: string) {
  const parts = address.split(".");
  if (parts.length !== 4) {
    return null;
  }

  let value = 0;
  for (const part of parts) {
    const octet = Number(part);
    if (!Number.isInteger(octet) || octet < 0 || octet > 255) {
      return null;
    }
    value = value * 256 + octet;
  }
  return value;
}

function isPrivateIpv4(address: string) {
  const value = ipv4ToInt(address);
  if (value === null) {
    return true; // Unparseable: fail closed.
  }

  return PRIVATE_IPV4_CIDRS.some(([network, prefix]) => {
    const networkValue = ipv4ToInt(network);
    if (networkValue === null) {
      return false;
    }
    // Avoid <<: a /0 shift is undefined-ish in JS bitwise ops and 32-bit signed
    // arithmetic would break for addresses above 127.x.
    const blockSize = 2 ** (32 - prefix);
    return Math.floor(value / blockSize) === Math.floor(networkValue / blockSize);
  });
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
