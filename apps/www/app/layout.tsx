import "@workspace/ui/globals.css";
import "./mobile.css";
import "./vercel-patterns.css";
import { ThemeProvider } from "next-themes";
import { Noto_Sans_JP } from "next/font/google";
import { JetBrains_Mono } from "next/font/google";
import { Inter } from "next/font/google";
import Script from "next/script";

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "700"],
  preload: false,
  variable: "--font-noto-sans-jp",
  display: "swap",
  fallback: ["Hiragino Sans", "Hiragino Kaku Gothic ProN", "sans-serif"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning>
      <head>
        {process.env.NODE_ENV === "development" && (
          <Script
            strategy="afterInteractive"
            crossOrigin="anonymous"
            src="//unpkg.com/react-scan/dist/auto.global.js"
          />
        )}
      </head>
      <body
        className={`${jetbrainsMono.variable} ${inter.variable} ${notoSansJP.variable} bg-background font-sans --font-noto-sans-jp antialiased text-foreground`}
      >
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
        </ThemeProvider>
      </body>
    </html>
  );
}
