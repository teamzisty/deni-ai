"use client";

import React from "react";
import { useAuth } from "@/context/auth-context";
import { Skeleton } from "@workspace/ui/components/skeleton";

import { Button } from "@workspace/ui/components/button";
import {
  LogOut,
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
import { memo } from "react";
import { useSettingsDialog } from "@/context/settings-dialog-context";
import { useSettings } from "@/hooks/use-settings";
import { signOut } from "@/lib/auth-client";
import { User } from "better-auth";

export const AccountManagement = () => {
  const { user, isPending } = useAuth();
  const isMobile =
    typeof window !== "undefined"
      ? require("@/hooks/use-mobile").useIsMobile()
      : false;
  if (isMobile) return null;

  if (isPending && !user) {
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
          await signOut();
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
  handleAuth: () => Promise<void>;
}

export const AccountDropdownMenu = memo(
  ({ user, isDisabled, handleAuth }: AccountDropdownMenuProps) => {
    const { settings } = useSettings();
    const { openDialog } = useSettingsDialog();

    if (!user && !isDisabled) {
      return (
        <Button variant="outline" className="rounded-full">
          <User2 size="16" />
          <span className="group-data-[collapsible=icon]:hidden">Login</span>
        </Button>
      );
    }

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {!isDisabled ? (
            <Button variant="ghost" className="h-16 p-2 ml-1 justify-start">
              {user?.image ? (
                <Image
                  src={user.image || ""}
                  alt={user.name || "User Avatar"}
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
                  {user?.image ? (
                    <Image
                      src={user?.image || ""}
                      alt={user?.name || "User Avatar"}
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
                      {truncateName(user?.name)}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
            )}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={handleAuth}>
              <LogOut /> Logout
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  },
);

AccountDropdownMenu.displayName = "AccountDropdownMenu";
