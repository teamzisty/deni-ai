import { GoogleAnalytics } from "@next/third-parties/google";
import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Geist, Geist_Mono, Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getExtracted, getLocale, getMessages } from "next-intl/server";
import { AdSenseScript } from "@/components/adsense-script";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { GA_ID } from "@/lib/constants";
import "./globals.css";
import "./themes.css";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
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

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#171717" },
  ],
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getExtracted();
  const description = t(
    "Free multi-model AI chat with GPT, Claude, Gemini, and more in one place.",
  );
  const adsenseAccount = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

  return {
    metadataBase: new URL("https://deniai.app"),
    applicationName: "Deni AI",
    title: {
      default: "Deni AI",
      template: "%s | Deni AI",
    },
    description,
    manifest: "/manifest.webmanifest",
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
    formatDetection: {
      address: false,
      email: false,
      telephone: false,
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: "Deni AI",
    },
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
    other: adsenseAccount
      ? {
          "google-adsense-account": adsenseAccount,
        }
      : undefined,
  };
}

function safeJsonLd(data: unknown) {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [locale, messages, t] = await Promise.all([getLocale(), getMessages(), getExtracted()]);

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${jetbrainsMono.variable} ${inter.variable} font-sans antialiased min-w-screen min-h-screen overflow-x-hidden transition-colors duration-500`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: safeJsonLd([
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                name: "Deni AI",
                alternateName: "deniai.app",
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
                name: [
                  "About",
                  "Use Cases",
                  "AI Models",
                  "Flixa",
                  "Terms of Service",
                  "Privacy Policy",
                ],
                url: [
                  "https://deniai.app/about",
                  "https://deniai.app/use-cases",
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
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <div className="min-h-screen">{children}</div>
            <Toaster position="top-center" />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
      <AdSenseScript />
      {process.env.NODE_ENV === "production" ? <GoogleAnalytics gaId={GA_ID} /> : null}
    </html>
  );
}
