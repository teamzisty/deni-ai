import { GoogleAnalytics } from "@next/third-parties/google";
import type { Metadata } from "next";
import { Outfit, JetBrains_Mono, Instrument_Serif, Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getExtracted, getLocale, getMessages } from "next-intl/server";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";
import { GA_ID } from "@/lib/constants";
import "./globals.css";
import "./themes.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const geistSans = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  display: "swap",
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
})

export async function generateMetadata(): Promise<Metadata> {
  const t = await getExtracted();
  return {
    title: t("Deni AI"),
    description: t("Best AI Chatbot for everyone."),
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  const t = await getExtracted();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${outfit.variable} ${geistSans.variable} ${geistMono.variable} ${jetbrainsMono.variable} ${instrumentSerif.variable} font-sans antialiased min-w-screen min-h-screen overflow-x-hidden transition-colors duration-500`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-foreground focus:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {t("Skip to content")}
        </a>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>
            <div className="min-h-screen">{children}</div>

            <Toaster position="top-center" />
          </Providers>
        </NextIntlClientProvider>
      </body>
      <GoogleAnalytics gaId={GA_ID} />
    </html>
  );
}
