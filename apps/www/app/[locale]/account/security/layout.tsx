import { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account");
  return {
    title: t("sidebarNav.security"),
    description: t("security.description")
  };
}

interface SecurityLayoutProps {
  children: ReactNode;
}

export default function SecurityLayout({ children }: SecurityLayoutProps) {
  return children;
} 