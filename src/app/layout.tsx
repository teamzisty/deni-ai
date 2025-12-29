import { GoogleAnalytics } from "@next/third-parties/google";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getExtracted, getLocale, getMessages } from "next-intl/server";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import "./themes.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased min-w-screen min-h-screen overflow-x-hidden transition-all duration-300`}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>
            <div className="min-h-screen">{children}</div>

            <Toaster position="top-center" />
          </Providers>
        </NextIntlClientProvider>
      </body>
      <GoogleAnalytics gaId="G-B5H8G73JTN" />
    </html>
  );
}
