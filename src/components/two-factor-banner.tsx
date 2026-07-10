"use client";

import { ShieldCheck, X, ArrowRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useExtracted } from "next-intl";
import { useSyncExternalStore } from "react";
import { authClient } from "@/lib/auth-client";
import { isCheckoutSettingsRoute } from "@/lib/settings-routes";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

const DISMISSED_KEY = "flixa-2fa-dismissed";
const DISMISSED_EVENT = "deni:2fa-dismissed";

function subscribeDismissed(onStoreChange: () => void) {
  const handleChange = () => onStoreChange();
  window.addEventListener("storage", handleChange);
  window.addEventListener(DISMISSED_EVENT, handleChange);
  return () => {
    window.removeEventListener("storage", handleChange);
    window.removeEventListener(DISMISSED_EVENT, handleChange);
  };
}

function getDismissedSnapshot() {
  return window.localStorage.getItem(DISMISSED_KEY) !== null;
}

function getServerDismissedSnapshot() {
  // Hide the promo banner until the client can read localStorage.
  return true;
}

function dismissTwoFactorBanner() {
  localStorage.setItem(DISMISSED_KEY, "1");
  window.dispatchEvent(new Event(DISMISSED_EVENT));
}

export function TwoFactorBanner() {
  const t = useExtracted();
  const pathname = usePathname();
  const session = authClient.useSession();
  const dismissed = useSyncExternalStore(
    subscribeDismissed,
    getDismissedSnapshot,
    getServerDismissedSnapshot,
  );
  const visible = !dismissed;

  if (
    isCheckoutSettingsRoute(pathname) ||
    pathname === "/account/settings" ||
    session.data?.user?.twoFactorEnabled
  ) {
    return (
      <header className="flex h-10 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
      </header>
    );
  }

  if (!visible) {
    return (
      <header className="flex h-10 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
      </header>
    );
  }

  return (
    <header className="w-full flex h-10 shrink-0 items-center gap-2 border-b bg-secondary/50 px-4 text-sm">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="h-4" />
      <div className="flex flex-1 items-center justify-between gap-2 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <ShieldCheck className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate text-muted-foreground">
            {t("2FA - Enhance your security with two-factor authentication")}
          </span>
          <Link
            href="/account/settings"
            className="shrink-0 inline-flex items-center gap-1 font-medium text-foreground hover:underline"
          >
            {t("Setup")}
            <ArrowRight className="size-3" />
          </Link>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 size-5"
          onClick={dismissTwoFactorBanner}
          aria-label={t("Dismiss")}
        >
          <X className="size-3" />
        </Button>
      </div>
    </header>
  );
}
