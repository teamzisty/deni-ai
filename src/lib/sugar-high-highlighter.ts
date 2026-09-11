import { highlight, type LanguageName } from "sugar-high";
import { lang, languages } from "sugar-high/lang";

const MAX_CACHE_ENTRIES = 80;

const cache = new Map<string, string>();

const canonicalNames = languages.map((entry) => entry.id);

export const supportedHighlightLanguages: string[] = [
  ...canonicalNames,
  ...languages.flatMap((entry) => [entry.extension, ...entry.aliases]),
];

const supportedLanguageSet = new Set(supportedHighlightLanguages.map((name) => name.toLowerCase()));

export function isHighlightLanguage(language: string): boolean {
  const key = language.trim().toLowerCase();
  return (
    key.length === 0 ||
    key === "text" ||
    key === "txt" ||
    key === "plain" ||
    key === "plaintext" ||
    supportedLanguageSet.has(key)
  );
}

function resolveLanguage(language: string): LanguageName {
  return lang(language) ?? "plaintext";
}

function cacheKey(code: string, language: string) {
  const start = code.slice(0, 80);
  const end = code.length > 80 ? code.slice(-80) : "";
  return `${language}:${code.length}:${start}:${end}`;
}

export function highlightCode(code: string, language: string): string {
  const key = cacheKey(code, language);
  const cached = cache.get(key);
  if (cached) {
    cache.delete(key);
    cache.set(key, cached);
    return cached;
  }

  const html = highlight(code, { lang: resolveLanguage(language) });
  cache.set(key, html);
  if (cache.size > MAX_CACHE_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest) {
      cache.delete(oldest);
    }
  }
  return html;
}
