"use client";

import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Link } from 'next-view-transitions';
import { usePathname } from "next/navigation";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const currentTab =
    pathname === "/settings"
      ? "general"
      : pathname.split("/").pop() || "general";

  return (
    <main className="w-full p-4">
      <h1 className="text-2xl font-bold mb-3">Deni AI の設定</h1>
      <Separator className="mb-3" />
      <div className="flex justify-center w-full">
        <div className="w-full md:w-2/3 lg:w-1/2">
          <Tabs value={currentTab} className="w-full mb-2">
            <TabsList>
              <TabsTrigger asChild value="general">
                <Link href="/settings">一般</Link>
              </TabsTrigger>
              <TabsTrigger asChild value="account">
                <Link href="/settings/account">アカウント</Link>
              </TabsTrigger>
              <TabsTrigger asChild value="model">
                <Link href="/settings/model">モデル</Link>
              </TabsTrigger>
            </TabsList>
            <TabsContent value={currentTab}> {children}</TabsContent>
          </Tabs>
        </div>
      </div>
    </main>
  );
}
