"use client";

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

// Helper functions to truncate email and name
const truncateEmail = (email: string | null | undefined): string => {
  if (!email) return "";
  const [username, domain] = email.split("@");
  if (!domain) return email;
  const truncatedUsername =
    username && username.length > 6
      ? `${username.substring(0, 6)}...`
      : username || "";
  return `${truncatedUsername}@${domain}`;
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
            <Button
              variant="ghost"
              className="mb-3 transition-all duration-300 px-4 py-4 group-data-[collapsible=icon]:px-0.5 group-data-[collapsible=icon]:py-2 group-data-[collapsible=icon]:mx-0 justify-start"
            >
              {user?.user_metadata?.avatar_url ? (
                <Image
                  src={user.user_metadata.avatar_url}
                  alt={
                    user.user_metadata?.full_name ||
                    user.user_metadata?.display_name ||
                    "User Avatar"
                  }
                  width={40}
                  height={40}
                  className={`rounded-full ${settings.privacyMode && "blur-sm"}`}
                  priority
                />
              ) : (
                <User2 size="16" />
              )}
              <div className="flex flex-col text-left group-data-[collapsible=icon]:hidden ml-1">
                <span className={settings.privacyMode ? "blur-sm" : ""}>
                  {truncateName(
                    user?.user_metadata?.full_name ||
                      user?.user_metadata?.display_name
                  )}
                </span>
                <span
                  className={`text-muted-foreground min-w-0 block truncate ${
                    settings.privacyMode ? "blur-sm" : ""
                  }`}
                >
                  {truncateEmail(user?.email)}
                </span>
              </div>
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
                  {" "}
                  {user?.user_metadata?.avatar_url ? (
                    <Image
                      src={user.user_metadata.avatar_url}
                      alt={
                        user.user_metadata?.full_name ||
                        user.user_metadata?.name ||
                        "User Avatar"
                      }
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
                      {truncateName(
                        user?.user_metadata?.full_name ||
                          user?.user_metadata?.name
                      )}
                    </span>
                    <span
                      className={`text-muted-foreground min-w-0 block truncate ${
                        settings.privacyMode && "blur-sm"
                      }`}
                    >
                      {truncateEmail(user?.email)}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
            )}

            {!isDisabled && (
              <DropdownMenuItem onClick={() => openDialog("account")}>
                <User2 />
                {t("accountMenu.account")}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => openDialog()}>
              <Settings />
              {t("accountMenu.userSettings")}
            </DropdownMenuItem>
          </DropdownMenuGroup>{" "}
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link href="/intellipulse" className="w-full">
                <Code2 />
                {t("intellipulseSidebar.intellipulse")}
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link href="https://voids.top" target="_blank" className="w-full">
                <Earth />
                voids.top
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link
                href="https://voids.top/docs"
                target="_blank"
                className="w-full"
              >
                <Notebook />
                Voids API Docs
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={handleAuth}>
              <LogOut /> {t("accountMenu.logout")}
            </DropdownMenuItem>
            <DropdownMenuLabel className="text-muted-foreground">
              {t("accountMenu.version", {
                version: buildInfo.version,
                codename: buildInfo.codename,
                type: buildInfo.type === "production" ? "prod" : "dev",
              })}
            </DropdownMenuLabel>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
);

AccountDropdownMenu.displayName = "AccountDropdownMenu";
