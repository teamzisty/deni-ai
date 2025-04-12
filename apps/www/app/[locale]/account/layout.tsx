"use server";

import { ReactNode } from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@repo/ui/components/button";
import { ArrowLeft } from "lucide-react";
import { AccountManagement } from "@/components/account/AccountManagement";
import { SidebarNav } from "@/components/account/SidebarNav";

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

  return (
    <div className="min-h-screen flex flex-col">
      <header className="w-screen h-16 bg-card/60">
        <div className="container mx-auto h-full flex items-center justify-between px-4">
          <div className="flex gap-2 items-center">
            <img
              src="/assets/icon-black.png"
              alt="Deni AI"
              width={32}
              height={32}
            />
            <span className="text-md font-bold">{t("title")}</span>
          </div>
          <div className="flex gap-2 items-center">
            <Button variant="outline" asChild>
              <Link href="/home">
                <ArrowLeft />
                {t("layout.return")}
              </Link>
            </Button>
          </div>
          <div className="flex-shrink-0">
            <AccountManagement />
          </div>
        </div>
      </header>
      <main className="flex-1 w-screen max-w-4xl  mx-auto flex items-center justify-center py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] md:max-h-[640px] h-[calc(100vh-164px)] bg-card/60 p-8 rounded-lg gap-8 max-w-7xl w-full ">
          <aside className="flex flex-col space-y-1">
            <SidebarNav />
          </aside>
          <main>{children}</main>
        </div>
      </main>
    </div>
  );
}
