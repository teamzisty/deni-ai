"use client";

import Link from "next/link";
import { useExtracted } from "next-intl";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth-client";

export function LoginButton() {
  const t = useExtracted();
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return <Skeleton className="h-10 w-32" />;
  }

  return (
    <Button size="lg" asChild>
      <Link href={session ? "/app" : "/auth/sign-in"}>
        {t("Get Started")}
      </Link>
    </Button>
  );
}
