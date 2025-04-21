"use server";

import { ReactNode } from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@workspace/ui/components/button";
import { ArrowLeft } from "lucide-react";
import { AccountManagement } from "@/components/account/AccountManagement";
import { SidebarNav } from "@/components/account/SidebarNav";
import Image from "next/image";
import { SearchBox } from "@/components/account/SearchBox";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "@workspace/ui/components/drawer";
import { Menu } from "lucide-react";

export async function generateMetadata() {
  const t = await getTranslations("account");
  return {
    title: t("title"),
    description: t("description"),
  };
}

interface AccountLayoutProps {
  children: ReactNode;
}

export default async function AccountLayout({ children }: AccountLayoutProps) {
  const t = await getTranslations("account");
  // Note: useIsMobile is a client hook, so we need to use a workaround for SSR/CSR split.
  // We'll use a dynamic import for the Drawer/hamburger menu and fallback to normal sidebar on SSR.
   
  const isMobile =
    typeof window !== "undefined"
      ? require("@/hooks/use-mobile").useIsMobile()
      : false;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="w-screen h-16 bg-card/60">
        <div className="container mx-auto h-full flex items-center justify-between px-4">
          <div className="flex gap-2 items-center">
            <Image
              src="/assets/icon-black.png"
              alt="Deni AI"
              width={32}
              height={32}
            />
            <span className="text-md font-bold">{t("title")}</span>
          </div>
          <div className="gap-2 items-center hidden md:flex">
            <SearchBox />
          </div>
          {/* Hide AccountManagement on mobile */}
          <div className="flex-shrink-0 hidden md:block">
            <AccountManagement />
          </div>
        </div>
      </header>
      <main className="flex-1 w-screen max-w-4xl  mx-auto flex items-center justify-center py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] md:max-h-[640px] sm:h-[calc(100vh-164px)] h-full bg-card/60 p-8 rounded-lg gap-8 max-w-7xl w-full ">
          {/* Hamburger menu for SidebarNav on mobile */}
          <aside className="flex flex-col space-y-1">
            <div className="block md:hidden">
              <Drawer>
                <DrawerTrigger asChild>
                  <button className="p-2 rounded-md border flex items-center gap-2">
                    <Menu className="h-5 w-5" />
                    <span>{t("menu")}</span> {/* en: Menu, ja: メニュー */}
                  </button>
                </DrawerTrigger>
                <DrawerContent className="p-8">
                  <DrawerTitle className="sr-only">{t("menu")}</DrawerTitle>
                  <SidebarNav />
                </DrawerContent>
              </Drawer>
            </div>
            <div className="hidden md:block">
              <SidebarNav />
            </div>
          </aside>
          <main className="overflow-y-visible sm:overflow-y-auto">
            {children}
          </main>
        </div>
      </main>
    </div>
  );
}
