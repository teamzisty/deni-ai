"use client";

import Link from "next/link";
import { useExtracted } from "next-intl";
import { GuestSignInButton } from "@/components/guest-sign-in-button";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth-client";

export function LoginButton() {
  const t = useExtracted();
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <div className="flex flex-col gap-3 sm:flex-row">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-40" />
      </div>
    );
  }

  if (session) {
    return (
      <Button size="lg" asChild className="w-full sm:w-auto">
        <Link href="/app">{t("Get Started")}</Link>
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Button size="lg" asChild className="w-full sm:w-auto">
        <Link href="/auth/sign-in">{t("Get Started")}</Link>
      </Button>
      <GuestSignInButton className="w-full sm:w-auto" />
    </div>
  );
}
