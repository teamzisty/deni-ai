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
        <Skeleton className="h-12 w-36 rounded-xl" />
        <Skeleton className="h-12 w-44 rounded-xl" />
      </div>
    );
  }

  if (session) {
    return (
      <Button size="lg" asChild className="group h-12 px-6 rounded-xl text-base font-medium shadow-md hover:shadow-lg transition-all duration-300">
        <Link href="/app">
          {t("Go to Chat")}
          <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Button size="lg" asChild className="group h-12 px-6 rounded-xl text-base font-medium shadow-md hover:shadow-lg transition-all duration-300">
        <Link href="/auth/sign-in">
          {t("Get Started")}
          <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </Button>
      <GuestSignInButton className="h-12 px-6 rounded-xl text-base" />
    </div>
  );
}
