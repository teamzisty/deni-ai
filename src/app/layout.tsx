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
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getExtracted();
  const description = t(
    "Access GPT, Claude, Gemini and more AI models in one place. Free, fast, and private AI chat for everyone.",
  );

  return {
    metadataBase: new URL("https://deniai.app"),
    title: {
      default: "Deni AI",
      template: "%s | Deni AI",
    },
    description,
    keywords: [
      "AI chat",
      "ChatGPT alternative",
      "Claude",
      "Gemini",
      "AI assistant",
      "free AI",
      "multi-model AI",
    ],
    authors: [{ name: "Deni AI" }],
    creator: "Deni AI",
    publisher: "Deni AI",
    openGraph: {
      type: "website",
      siteName: "Deni AI",
      title: "Deni AI",
      description,
      locale: "en_US",
      images: [
        {
          url: "/og.png",
          width: 800,
          height: 600,
          alt: "Deni AI",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Deni AI",
      description,
      images: ["/og.png"],
    },
    robots: {
      index: true,
      follow: true,
    },
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                name: "Deni AI",
                url: "https://deniai.app",
                potentialAction: {
                  "@type": "SearchAction",
                  target: "https://deniai.app/chat?q={search_term_string}",
                  "query-input": "required name=search_term_string",
                },
              },
              {
                "@context": "https://schema.org",
                "@type": "SiteNavigationElement",
                name: ["About", "AI Models", "Flixa", "Terms of Service", "Privacy Policy"],
                url: [
                  "https://deniai.app/about",
                  "https://deniai.app/models",
                  "https://deniai.app/flixa",
                  "https://deniai.app/legal/terms",
                  "https://deniai.app/legal/privacy-policy",
                ],
              },
            ]),
          }}
        />
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
