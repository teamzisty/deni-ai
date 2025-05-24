import React from "react";
import { getTranslations } from "next-intl/server";
import { AuthProvider } from "../../context/AuthContext";
import { DevelopmentBanner } from "../../components/DevelopmentBanner";
import { Toaster } from "@workspace/ui/components/sonner";
import { Locale, NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { CanvasProvider } from "../../context/CanvasContext";
import { Analytics } from "@vercel/analytics/next";
import AnalyticsConsent from "@/components/AnalyticsConsent";
import { getAnalytics } from "@/lib/getAnalytics";
import { cookies } from "next/headers";
import { SettingsProvider } from "@/hooks/use-settings";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: Locale }>;
};

export async function generateMetadata() {
  const t = await getTranslations();

  return {
    title: t("layout.title"),
    description: t("layout.description"),
    openGraph: {
      title: t("layout.title"),
      description: t("layout.description"),
      url: "https://deniai.app",
      siteName: "Deni AI",
      images: [
        {
          url: "https://deniai.app/banner.png",
          width: 800,
          height: 600,
        },
      ],
    },
    metadataBase: new URL("https://deniai.app"),
    alternates: {
      canonical: "/",
      languages: {
        en: "/en",
        ja: "/ja",
      },
    },
  };
}

export async function getAnalyticsConsent() {
  const cookieStore = await cookies();
  const consentCookie = cookieStore.get("analytics-consent");

  // Return undefined if cookie doesn't exist (first visit)
  if (!consentCookie) {
    return undefined;
  }

  return consentCookie.value === "true";
}

export default async function LocaleLayout({ children, params }: Props) {
  // Ensure that the incoming `locale` is valid
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Load messages for the current locale
  let messages;
  try {
    messages = (await import(`../../messages/${locale}.json`)).default;
  } catch (error) {
    console.error(`Failed to load messages for locale: ${locale}`, error);
  }

  const isAnalyticsEnabled = await getAnalyticsConsent();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <AuthProvider>
        <SettingsProvider>
          <CanvasProvider>
            <DevelopmentBanner>{children}</DevelopmentBanner>
            <Toaster richColors position="bottom-right" />

            <AnalyticsConsent initialConsent={isAnalyticsEnabled} />
            {isAnalyticsEnabled && <Analytics />}
          </CanvasProvider>
        </SettingsProvider>
      </AuthProvider>
    </NextIntlClientProvider>
  );
}
