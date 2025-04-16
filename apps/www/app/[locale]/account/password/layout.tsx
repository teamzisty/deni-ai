import { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account");
  return {
    title: t("sidebarNav.password"),
    description: t("password.description")
  };
}

interface PasswordLayoutProps {
  children: ReactNode;
}

export default function PasswordLayout({ children }: PasswordLayoutProps) {
  return children;
} 