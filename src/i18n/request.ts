import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";
import { defaultLocale, locales, type AppLocale } from "@/i18n/locales";

const getPreferredLocaleFromHeader = (
  acceptLanguage: string | null,
): AppLocale | null => {
  if (!acceptLanguage) {
    return null;
  }

  const candidates = acceptLanguage
    .split(",")
    .map((entry, index) => {
      const [rawTag, ...params] = entry.trim().split(";");
      if (!rawTag) {
        return null;
      }

      let quality = 1;
      for (const param of params) {
        const [key, value] = param.trim().split("=");
        if (key === "q") {
          const parsed = Number.parseFloat(value ?? "");
          if (!Number.isNaN(parsed)) {
            quality = parsed;
          }
        }
      }

      return {
        tag: rawTag.toLowerCase(),
        quality,
        index,
      };
    })
    .filter(
      (
        candidate,
      ): candidate is { tag: string; quality: number; index: number } =>
        candidate !== null && candidate.tag !== "*",
    )
    .sort((a, b) => b.quality - a.quality || a.index - b.index);

  for (const candidate of candidates) {
    const matched = locales.find(
      (locale) =>
        candidate.tag === locale || candidate.tag.startsWith(`${locale}-`),
    );
    if (matched) {
      return matched;
    }
  }

  return null;
};

export default getRequestConfig(async () => {
  const store = await cookies();
  const requestHeaders = await headers();
  const persistedLocale = store.get("locale")?.value;
  const storedLocale = locales.find((locale) => locale === persistedLocale);
  const headerLocale = getPreferredLocaleFromHeader(
    requestHeaders.get("accept-language"),
  );
  const locale = storedLocale ?? headerLocale ?? defaultLocale;
  const messages = (await import(`../../messages/${locale}.json`)).default;

  return {
    locale,
    messages,
  };
});
