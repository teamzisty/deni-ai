"use client";

import { ArrowRight } from "lucide-react";
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
        <Skeleton className="h-10 w-36 rounded-xl" />
        <Skeleton className="h-10 w-44 rounded-xl" />
      </div>
    );
  }

  if (session) {
    return (
      <Button size="lg" asChild className="group">
        <Link href="/chat">
          {t("Go to Chat")}
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Button size="lg" asChild className="group">
        <Link href="/auth/sign-in">
          {t("Get Started")}
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </Button>
      <GuestSignInButton />
    </div>
  );
}
