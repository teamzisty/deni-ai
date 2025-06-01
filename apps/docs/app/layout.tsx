import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@workspace/ui/globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SidebarProvider } from "@workspace/ui/components/sidebar";
import { Toaster } from "@workspace/ui/components/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Deni AI Docs",
  description: "A documentation and blog of Deni AI - Powerful, customizable AI conversations",
  keywords: ["Deni AI", "AI", "Documentation", "Open Source"],
  authors: [{ name: "Deni AI Team" }],
  openGraph: {
    title: "Deni AI Docs",
    description: "A documentation and blog of Deni AI - Powerful, customizable AI conversations",
    type: "website",
    locale: "en_US",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SidebarProvider defaultOpen={true}>
            
            <div className="min-h-screen flex flex-col min-w-screen">
              {children}
            </div>
            <Toaster />
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
