"use client";

import { LogOut, Settings, UserIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useExtracted } from "next-intl";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";
import { versions } from "@/lib/version";

export function AccountMenu() {
  const t = useExtracted();
  const router = useRouter();
  const session = authClient.useSession();
  const isAnonymous = Boolean(session.data?.user?.isAnonymous);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton className="h-auto py-2">
          <div className="flex w-full items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground overflow-hidden">
              {session.data?.user?.image ? (
                <Image
                  src={session.data.user.image}
                  alt={session.data.user.name ?? t("User")}
                  className="size-full object-cover"
                  width={32}
                  height={32}
                  sizes="32px"
                  unoptimized
                />
              ) : (
                (session.data?.user?.name?.charAt(0).toUpperCase() ?? "U")
              )}
            </div>
            <span className="flex-1 truncate text-sm">
              {session.data?.user?.name ?? t("User")}
            </span>
          </div>
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="start" className="w-56">
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground overflow-hidden text-xs">
            {session.data?.user?.image ? (
              <Image
                src={session.data.user.image}
                alt={session.data.user.name ?? t("User")}
                className="size-full object-cover"
                width={24}
                height={24}
                sizes="24px"
                unoptimized
              />
            ) : (
              (session.data?.user?.name?.charAt(0).toUpperCase() ?? "U")
            )}
          </div>
          <div className="flex-1 flex flex-col min-w-0">
            <span className="flex-1 truncate text-sm font-medium">
              {session.data?.user?.name ?? t("User")}
            </span>
            <span className="flex-1 truncate text-sm">
              {session.data?.user?.email ?? t("User")}
            </span>
          </div>
        </div>
        {
          <span className="px-2 py-1 text-xs text-muted-foreground">
            Deni AI {versions.version}, {versions.codename}
          </span>
        }
        <DropdownMenuItem className="gap-2 text-sm" asChild>
          <Link href="/account/settings" className="flex w-full">
            <UserIcon className="size-4" />
            <span className="flex-1">{t("Account")}</span>
          </Link>
        </DropdownMenuItem>
        {!isAnonymous && (
          <DropdownMenuItem className="gap-2 text-sm" asChild>
            <Link href="/settings/appearance" className="flex w-full">
              <Settings className="size-4" />
              <span className="flex-1">{t("Settings")}</span>
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="gap-2 text-sm"
          onClick={() => {
            authClient.signOut();
            router.push("/");
          }}
        >
          <LogOut className="size-4" />
          <span>{t("Logout")}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
