import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AccountSettings } from "@/components/account/AccountSettings";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account");
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function AccountPage() {
  return <AccountSettings />;
}
