/**
 * Fetches the latest disposable-email domain lists from the upstream repo and
 * writes the deduplicated, allowlist-filtered result to `data/domains.json`.
 *
 * Usage (from this package): bun run refresh
 * Usage (from repo root):    bun run disposable:refresh
 */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const RAW_BASE =
  "https://raw.githubusercontent.com/disposable-email-domains/disposable-email-domains/main";
const BLOCKLIST_URL = `${RAW_BASE}/disposable_email_blocklist.conf`;
// The upstream repo currently ships no allowlist; this stays best-effort so the
// refresh keeps working if/when an allowlist is (re)added. A 404 means "empty".
const ALLOWLIST_URL = `${RAW_BASE}/allowlist.conf`;

function parseList(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim().toLowerCase())
    .filter((line) => line.length > 0 && !line.startsWith("#"));
}

async function fetchList(url: string): Promise<string[]> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }
  return parseList(await res.text());
}

async function fetchOptionalList(url: string): Promise<string[]> {
  const res = await fetch(url);
  if (res.status === 404) {
    console.warn(`Allowlist not found at ${url} (404) — continuing with none.`);
    return [];
  }
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }
  return parseList(await res.text());
}

async function main(): Promise<void> {
  console.log("Fetching disposable email domain lists...");
  const [blocklist, allowlist] = await Promise.all([
    fetchList(BLOCKLIST_URL),
    fetchOptionalList(ALLOWLIST_URL),
  ]);

  const allow = new Set(allowlist);
  const domains = [...new Set(blocklist)].filter((domain) => !allow.has(domain)).sort();

  const dataDir = join(dirname(fileURLToPath(import.meta.url)), "..", "data");
  await mkdir(dataDir, { recursive: true });
  await writeFile(join(dataDir, "domains.json"), `${JSON.stringify(domains)}\n`);

  console.log(
    `Wrote ${domains.length} domains (blocklist ${blocklist.length}, allowlist ${allowlist.length}) to data/domains.json`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
