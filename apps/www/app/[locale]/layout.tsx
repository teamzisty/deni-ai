import React from "react";
import { getTranslations } from "next-intl/server";
import { AuthProvider } from "../../context/AuthContext";
import { ChatSessionsProvider } from "../../hooks/use-chat-sessions";
import { SettingsDialogProvider } from "../../context/SettingsDialogContext";
import { SettingsDialog } from "../../components/SettingsDialog";
import { DevelopmentBanner } from "../../components/DevelopmentBanner";
import { Toaster } from "@repo/ui/components/sonner";
import { Locale, NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";

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

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <AuthProvider>
        <ChatSessionsProvider>
          <SettingsDialogProvider>
            <DevelopmentBanner>{children}</DevelopmentBanner>
            <Toaster richColors position="bottom-right" />
            <SettingsDialog />
          </SettingsDialogProvider>
        </ChatSessionsProvider>
      </AuthProvider>
    </NextIntlClientProvider>
  );
}
