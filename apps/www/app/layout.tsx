import "@repo/ui/globals.css";
import { ThemeProvider } from "next-themes";
import { Noto_Sans_JP } from "next/font/google";
import { JetBrains_Mono } from "next/font/google";
import { Inter } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/react";

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  variable: "--font-noto-sans-jp",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning>
      <head>
        {/* {process.env.NODE_ENV === 'development' && (
          <Script
            strategy="afterInteractive"
            crossOrigin="anonymous"
            src="//unpkg.com/react-scan/dist/auto.global.js"
          />
        )} */}
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} ${notoSansJP.variable} bg-background font-sans antialiased text-foreground`}
      >
        {" "}
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          storageKey="theme"
          value={{
            light: "light",
            dark: "dark",
            system: "system",
          }}
        >
          {children}
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
