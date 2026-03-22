"use client";

import Script from "next/script";
import { env } from "@/env";

export function AdSenseScript() {
  if (!env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || process.env.NODE_ENV !== "production") {
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
