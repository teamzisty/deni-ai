import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import { routing } from "@/i18n/routing";
import { hasLocale } from "next-intl";

/**
 * Get locale from request headers or query parameters
 * Falls back to default locale if not found or invalid
 */
export async function getLocaleFromRequest(request: Request): Promise<string> {
  // First try to get locale from query parameters
  const url = new URL(request.url);
  const queryLocale = url.searchParams.get("locale");

  if (queryLocale && hasLocale(routing.locales, queryLocale)) {
    return queryLocale;
  }

  // Then try to get locale from Accept-Language header
  const headersList = await headers();
  const acceptLanguage = headersList.get("accept-language");

  if (acceptLanguage) {
    // Parse Accept-Language header (e.g., "en-US,en;q=0.9,ja;q=0.8")
    const languages = acceptLanguage
      .split(",")
      .map((lang) => {
        const [code, priority] = lang.trim().split(";q=");
        return {
          code: code?.split("-")[0] || "", // Get language code without region
          priority: priority ? parseFloat(priority) : 1.0,
        };
      })
      .sort((a, b) => b.priority - a.priority);

    // Find first matching locale
    for (const lang of languages) {
      if (hasLocale(routing.locales, lang.code)) {
        return lang.code;
      }
    }
  }

  // Fall back to default locale
  return routing.defaultLocale;
}

/**
 * Get translations for API routes with locale detection
 */
export async function getApiTranslations(
  request: Request,
  namespace: string = "common",
) {
  const locale = await getLocaleFromRequest(request);
  return getTranslations({ locale, namespace });
}
