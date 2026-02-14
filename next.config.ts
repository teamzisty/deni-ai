import type { NextConfig } from "next";
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
        source: "/models",
        headers: marketingCacheHeaders,
      },
      {
        source: "/flixa",
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

export default withNextIntl(nextConfig);
