"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import { Progress } from "@workspace/ui/components/progress";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { useSupabase } from "@/context/supabase-context";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { LogOut, SettingsIcon, User } from "lucide-react";
import { BRAND_NAME, models, PREMIUM_USES_LIMIT, VERSION } from "@/lib/constants";
import { useSettingsDialog } from "@/context/settings-dialog-context";
import { useTranslations } from "@/hooks/use-translations";

export function UserDropdownMenu() {
  const { supabase, user, usage, ssUserData, loading } = useSupabase();
  const { openDialog } = useSettingsDialog();
  const router = useRouter();
  const t = useTranslations();

  const getInitials = (name: string) => {
    if (!name) return "U"; // Fallback if no name is provided
    return name
      .split(" ")
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(t("chat.userMenu.logOutFailed"));
    } else {
      router.push("/auth/login");
    }
  };

  if (loading) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="fixed top-4 right-4 h-8 w-8 rounded-full"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={user?.user_metadata.avatar_url}
              alt={user?.user_metadata.full_name}
            />
            <AvatarFallback>
              {getInitials(user?.user_metadata.full_name)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user?.user_metadata.full_name}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {usage && (
          <>
            <DropdownMenuLabel>{t("chat.userMenu.usage")}</DropdownMenuLabel>
            <div className="p-2 text-sm pt-0">
              <div className="flex flex-col space-y-2 w-full">
                <span className="text-muted-foreground">
                  {t("chat.userMenu.yourPlan")}{" "}
                  {ssUserData?.plan && ssUserData?.plan != "free" ? (
                    <span className="bg-gradient-to-r from-pink-400 to-sky-500 bg-clip-text text-transparent capitalize">
                      {ssUserData?.plan}
                    </span>
                  ) : (
                    <span>{t("chat.userMenu.free")}</span>
                  )}
                </span>
                {usage
                  .filter((u) => u.premium)
                  .map((u) => (
                    <div key={u.model} className="space-y-1 w-full">
                      <div className="flex justify-between text-xs">
                        <span>{models[u.model]?.name}</span>
                        <span>{t("chat.userMenu.uses", { count: u.count })}</span>
                      </div>
                      <Progress value={u.count} max={PREMIUM_USES_LIMIT === -1 ? Infinity : PREMIUM_USES_LIMIT} />
                    </div>
                  ))}
              </div>
            </div>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem onClick={() => openDialog("account")}>
          <User />
          {t("chat.userMenu.account")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => openDialog()}>
          <SettingsIcon />
          {t("chat.userMenu.settings")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleLogout} variant="destructive">
          <LogOut />
          {t("chat.userMenu.logOut")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-muted-foreground">
          {BRAND_NAME} v{VERSION.version} ({VERSION.codename})
        </DropdownMenuLabel>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
