"use client";

import { Separator } from "@repo/ui/components/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui/components/tabs";
import { Link } from 'next-view-transitions';
import { useParams, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations();
  const pathname = usePathname();
  const params = useParams();
  const language = params.locale === "ja" ? "ja" : "en";

  const currentTab =
    pathname === `/${language}/settings`
      ? "general"
      : pathname.split("/").pop() || "general";

  return (
    <main className="w-full p-4">
      <h1 className="text-2xl font-bold mb-3">{t("settingsLayout.title")}</h1>
      <Separator className="mb-3" />
      <div className="flex justify-center w-full">
        <div className="w-full md:w-2/3 lg:w-1/2">
          <Tabs value={currentTab} className="w-full mb-2">
            <TabsList>
              <TabsTrigger asChild value="general">
                <Link href="/settings">{t("settingsLayout.general")}</Link>
              </TabsTrigger>
              <TabsTrigger asChild value="account">
                <Link href="/settings/account">{t("settingsLayout.account")}</Link>
              </TabsTrigger>
              <TabsTrigger asChild value="model">
                <Link href="/settings/model">{t("settingsLayout.model")}</Link>
              </TabsTrigger>
            </TabsList>
            <TabsContent value={currentTab}> {children}</TabsContent>
          </Tabs>
        </div>
      </div>
    </main>
  );
}
