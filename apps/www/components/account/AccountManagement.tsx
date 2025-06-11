"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { Skeleton } from "@workspace/ui/components/skeleton";

import { Button } from "@workspace/ui/components/button";
import {
  Code2,
  CrownIcon,
  Earth,
  FolderSync,
  LogOut,
  Notebook,
  Settings,
  User2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import Image from "next/image";
import { memo, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { Link } from "@/i18n/navigation";
import { useChatSessions } from "@/hooks/use-chat-sessions";
import { toast } from "sonner";
import { buildInfo } from "@/lib/version";
import { useTranslations } from "next-intl";
import { useSettingsDialog } from "@/context/SettingsDialogContext";
import { useRouter } from "next/navigation";
import { useSettings } from "@/hooks/use-settings";

export const AccountManagement = () => {
  const { user, isLoading, supabase } = useAuth();
  const isMobile =
    typeof window !== "undefined"
      ? require("@/hooks/use-mobile").useIsMobile()
      : false;
  if (isMobile) return null;

  if (isLoading && !supabase) {
    return (
      <div className="flex items-center mt-2 gap-2">
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>
    );
  }

  return (
    <div>
      <AccountDropdownMenu
        user={user}
        handleAuth={async () => {
          await supabase?.auth.signOut();
        }}
      />
    </div>
  );
};
const truncateName = (name: string | null | undefined): string => {
  if (!name) return "";
  return name.length > 15 ? `${name.substring(0, 15)}...` : name;
};

interface AccountDropdownMenuProps {
  user: User | null;
  isDisabled?: boolean;
  handleAuth: () => void;
}

export const AccountDropdownMenu = memo(
  ({ user, isDisabled, handleAuth }: AccountDropdownMenuProps) => {
    const { settings } = useSettings();
    const t = useTranslations();
    const { openDialog } = useSettingsDialog();

    if (!user && !isDisabled) {
      return (
        <Button variant="outline" className="rounded-full">
          <User2 size="16" />
          <span className="group-data-[collapsible=icon]:hidden">
            {t("accountMenu.login")}
          </span>
        </Button>
      );
    }

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {!isDisabled ? (
            <Button variant="ghost" className="h-16 p-2 ml-1 justify-start">
              {user?.user_metadata.avatar_url ? (
                <Image
                  src={user.user_metadata.avatar_url}
                  alt={user.user_metadata.full_name || "User Avatar"}
                  width={40}
                  height={40}
                  className={`rounded-full ${settings.privacyMode && "blur-sm"}`}
                  priority
                />
              ) : (
                <User2 size="16" />
              )}
            </Button>
          ) : (
            <Button variant="outline" className="rounded-full">
              <User2 size="16" />
              <span className="group-data-[collapsible=icon]:hidden">User</span>
            </Button>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-(--radix-dropdown-menu-trigger-width) min-w-56"
          align="start"
        >
          <DropdownMenuGroup>
            {!isDisabled && (
              <DropdownMenuLabel>
                <div className="h-16 justify-start flex items-center gap-2 md:max-w-[210px]">
                  {user?.user_metadata.avatar_url ? (
                    <Image
                      src={user?.user_metadata.avatar_url}
                      alt={user?.user_metadata.full_name || "User Avatar"}
                      width={40}
                      height={40}
                      className={`rounded-full ${settings.privacyMode && "blur-sm"}`}
                      priority
                    />
                  ) : (
                    <User2 size="16" />
                  )}
                  <div className="flex flex-col text-left">
                    <span className={`${settings.privacyMode && "blur-sm"}`}>
                      {truncateName(user?.user_metadata.full_name)}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
            )}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={handleAuth}>
              <LogOut /> {t("accountMenu.logout")}
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  },
);

AccountDropdownMenu.displayName = "AccountDropdownMenu";
