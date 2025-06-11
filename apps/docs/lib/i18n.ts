export const locales = [
  {
    code: "en",
    name: "English",
    flag: "🇺🇸",
  },
  {
    code: "ja",
    name: "日本語",
    flag: "🇯🇵",
  },
] as const;

export type Locale = (typeof locales)[number]["code"];

export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  en: "English",
  ja: "日本語",
};

export const localeFlags: Record<Locale, string> = {
  en: "🇺🇸",
  ja: "🇯🇵",
};

export function getLocaleFromPathname(pathname: string): Locale {
  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0];

  if (locales.some((locale) => locale.code === firstSegment)) {
    return firstSegment as Locale;
  }

  return defaultLocale;
}

export function removeLocaleFromPathname(pathname: string): string {
  const locale = getLocaleFromPathname(pathname);
  if (locale === defaultLocale) {
    return pathname;
  }

  return pathname.replace(`/${locale}`, "") || "/";
}

export function addLocaleToPathname(pathname: string, locale: Locale): string {
  if (locale === defaultLocale) {
    return pathname;
  }

  const cleanPathname = removeLocaleFromPathname(pathname);
  return `/${locale}${cleanPathname}`;
}
