import React from "react";
import { getTranslations } from "next-intl/server";
import { AuthProvider } from "../../context/AuthContext";
import { DevelopmentBanner } from "../../components/DevelopmentBanner";
import { Toaster } from "@workspace/ui/components/sonner";
import { Locale, NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { CanvasProvider } from "../../context/CanvasContext";
import { Analytics } from "@vercel/analytics/react";
import AnalyticsConsent from "@/components/AnalyticsConsent";
import { getAnalytics } from "@/lib/getAnalytics";
import { cookies } from "next/headers";

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
      url: "https://deni-ai.vercel.app",
      siteName: "Deni AI",
      images: [
        {
          url: "https://deni-ai.vercel.app/banner.png",
          width: 800,
          height: 600,
        },
      ],
    },
    metadataBase: new URL("https://deni-ai.vercel.app"),
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
  const isAnalyticsEnabled = cookieStore.get("analytics-consent")?.value === "true";
  return isAnalyticsEnabled;
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
            <CanvasProvider>
              <DevelopmentBanner>{children}</DevelopmentBanner>
              <Toaster richColors position="bottom-right" />

              <AnalyticsConsent initialConsent={isAnalyticsEnabled} />
              {isAnalyticsEnabled && <Analytics />}
            </CanvasProvider>
      </AuthProvider>
    </NextIntlClientProvider>
  );
}
