import { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("login.passwordReset");
  return {
    title: t("title"),
    description: t("description"),
  };
}

interface PasswordResetLayoutProps {
  children: ReactNode;
}

export default function PasswordResetLayout({
  children,
}: PasswordResetLayoutProps) {
  return children;
}
