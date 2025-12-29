import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { defaultLocale, locales, type AppLocale } from "@/i18n/locales";

export default getRequestConfig(async () => {
  const store = await cookies();
  const persistedLocale = store.get("locale")?.value;
  const locale = locales.includes(persistedLocale as AppLocale)
    ? (persistedLocale as AppLocale)
    : defaultLocale;
  const messages = (await import(`../../messages/${locale}.json`)).default;

  return {
    locale,
    messages,
  };
});
