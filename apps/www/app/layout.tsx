import "@repo/ui/globals.css";
import { ThemeProvider } from "next-themes";
import { Noto_Sans_JP } from "next/font/google";
import { JetBrains_Mono } from "next/font/google";
import { Inter } from "next/font/google";
import Script from "next/script";

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
        <script
          async
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Remove legacy theme handling
                  // document.documentElement.setAttribute('data-default-theme', 'loading');
                  
                  // const applyDefaultTheme = () => {
                  //   const isDefaultTheme = localStorage.getItem('defaultTheme') === 'true';
                  //   const currentTheme = localStorage.getItem('theme') || 'system';
                  //   document.documentElement.setAttribute('data-default-theme', isDefaultTheme ? 'true' : 'false');
                    
                  //   // Handle dark mode for legacy theme
                  //   if (isDefaultTheme) {
                  //     if (currentTheme === 'dark') {
                  //       document.documentElement.classList.add('dark');
                  //     } else {
                  //       document.documentElement.classList.remove('dark');
                  //     }
                  //   } else {
                  //     // For new theme, let next-themes handle it
                  //     if (currentTheme === 'dark') {
                  //       document.documentElement.classList.add('dark');
                  //     } else if (currentTheme === 'light') {
                  //       document.documentElement.classList.remove('dark');
                  //     }
                  //     // For system theme, we'll let next-themes handle it
                  //   }
                  // };
                  
                  // // DOMContentLoadedイベントで実行
                  // document.addEventListener('DOMContentLoaded', applyDefaultTheme);
                  
                  // // 即時実行も追加（DOMContentLoadedが発火しない場合のため）
                  // applyDefaultTheme();
                  
                  // // Listen for theme changes
                  // window.addEventListener('storage', (e) => {
                  //   if (e.key === 'theme' || e.key === 'defaultTheme') {
                  //     applyDefaultTheme();
                  //   }
                  // });
                } catch (e) {
                  // localStorage might not be available
                  console.error('Error accessing localStorage:', e);
                }
              })();
            `,
          }}
        />
        
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
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          storageKey="theme"
          value={{
            light: "light",
            dark: "dark",
            system: "system"
          }}
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
