"use client";

import { Button } from "@workspace/ui/components/button";
import { useRouter } from "next/navigation";
import { useTranslations } from "@/hooks/use-translations";
import { signOut } from "@/lib/auth-client";

export function LogoutButton() {
  const router = useRouter();
  const t = useTranslations();

  const logout = async () => {
    await signOut();
    router.push("/auth/login");
  };

  return <Button onClick={logout}>{t("chat.userMenu.logOut")}</Button>;
}
