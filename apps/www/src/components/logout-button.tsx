"use client";

import { supabase } from "@/lib/supabase";
import { Button } from "@workspace/ui/components/button";
import { useRouter } from "next/navigation";
import { useTranslations } from "@/hooks/use-translations";

export function LogoutButton() {
  const router = useRouter();
  const t = useTranslations();

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return <Button onClick={logout}>{t("chat.userMenu.logOut")}</Button>;
}
