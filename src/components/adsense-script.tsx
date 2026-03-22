"use client";

import Script from "next/script";
import { env } from "@/env";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/lib/trpc/react";

export function AdSenseScript() {
  const session = authClient.useSession();
  const hasSession = Boolean(session.data?.session);
  const usageQuery = trpc.billing.usage.useQuery(undefined, {
    enabled: hasSession,
    staleTime: 30000,
  });
  const isPaidUser = hasSession && usageQuery.data ? usageQuery.data.tier !== "free" : false;

  if (!env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || process.env.NODE_ENV !== "production") {
    return null;
  }

  if (session.isPending || (hasSession && usageQuery.isLoading) || isPaidUser) {
    return null;
  }

  return (
    <Script
      id="adsense-script"
      async
      strategy="lazyOnload"
      crossOrigin="anonymous"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}`}
    />
  );
}
