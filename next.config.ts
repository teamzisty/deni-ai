import type { NextConfig } from "next";
import { withBotId } from "botid/next/config";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  /* config options here */
  transpilePackages: ["shiki"],
  reactCompiler: true,
  poweredByHeader: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  async headers() {
    const securityHeaders = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(self), geolocation=()",
      },
      {
        key: "Content-Security-Policy",
        value:
          "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://www.googletagmanager.com https://js.stripe.com https://*.js.stripe.com https://pagead2.googlesyndication.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https: wss: https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net; frame-src https://challenges.cloudflare.com https://js.stripe.com https://*.js.stripe.com https://hooks.stripe.com https://googleads.g.doubleclick.net https://tpc.googlesyndication.com; object-src 'none'; base-uri 'self'",
      },
    ];

    const marketingCacheHeaders = [
      { key: "Cache-Control", value: "public, s-maxage=3600, stale-while-revalidate=86400" },
      { key: "Vary", value: "x-locale" },
    ];

    const legalCacheHeaders = [
      { key: "Cache-Control", value: "public, s-maxage=86400, stale-while-revalidate=604800" },
      { key: "Vary", value: "x-locale" },
    ];

    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        source: "/manifest.webmanifest",
        headers: [{ key: "Cache-Control", value: "public, max-age=0, must-revalidate" }],
      },
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        source: "/home",
        headers: marketingCacheHeaders,
      },
      {
        source: "/about",
        headers: marketingCacheHeaders,
      },
      {
        source: "/use-cases",
        headers: marketingCacheHeaders,
      },
      {
        source: "/models",
        headers: marketingCacheHeaders,
      },
      {
        source: "/flixa",
        headers: marketingCacheHeaders,
      },
      {
        source: "/desktop",
        headers: marketingCacheHeaders,
      },
      {
        source: "/legal/:path*",
        headers: legalCacheHeaders,
      },
      {
        source: "/migration",
        headers: legalCacheHeaders,
      },
      {
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "private, no-cache, no-store" }],
      },
    ];
  },
  experimental: {
    turbopackFileSystemCacheForBuild: true,
    turbopackFileSystemCacheForDev: true,
  },
};

const withNextIntl = createNextIntlPlugin({
  experimental: {
    srcPath: "./src",
    extract: {
      sourceLocale: "en",
    },
    messages: {
      path: "./messages",
      format: "json",
      locales: ["en", "ja"],
    },
  },
});

export default withBotId(withNextIntl(nextConfig));
