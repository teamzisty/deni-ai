import { LingoProvider } from "@lingo.dev/compiler/react";
import { GoogleAnalytics } from "@next/third-parties/google";
import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "Deni AI",
  description: "Best AI Chatbot for everyone.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <LingoProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased min-w-screen min-h-screen overflow-x-hidden transition-all duration-300`}
        >
          <Providers>
            <div className="min-h-screen">{children}</div>

            <Toaster position="top-center" />
          </Providers>
        </body>
        <GoogleAnalytics gaId="G-B5H8G73JTN" />
      </html>
    </LingoProvider>
  );
}
