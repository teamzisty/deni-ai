import "@workspace/ui/globals.css";
import "./mobile.css";
import "./vercel-patterns.css";
import { ThemeProvider } from "next-themes";
import { Noto_Sans_JP } from "next/font/google";
import { JetBrains_Mono } from "next/font/google";
import { Inter } from "next/font/google";
import Script from "next/script";

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '700'],
  preload: false,
  variable: '--font-noto-sans-jp',
  display: 'swap',
  fallback: ['Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'sans-serif'],
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
        <script
          dangerouslySetInnerHTML={{
            __html: `
                !function(e,t,n,s,u,a)
                {e.twq ||
                  ((s = e.twq =
                    function () {
                      s.exe ? s.exe.apply(s, arguments) : s.queue.push(arguments);
                    }),
                  (s.version = "1.1"),
                  (s.queue = []),
                  (u = t.createElement(n)),
                  (u.async = !0),
                  (u.src = "https://static.ads-twitter.com/uwt.js"),
                  (a = t.getElementsByTagName(n)[0]),
                  a.parentNode.insertBefore(u, a))}
                (window,document,'script'); twq('config','potlg');
              `,
          }}
        />
      </head>
      <body
        className={`${jetbrainsMono.variable} ${inter.variable} ${notoSansJP.variable} overflow-hidden bg-background font-sans --font-noto-sans-jp antialiased text-foreground`}
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

          <script
            dangerouslySetInnerHTML={{
              __html: `
              twq('event', 'tw-potlg-potli', {});
            `,
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
