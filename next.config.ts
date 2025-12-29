import { withBotId } from "botid/next/config";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  /* config options here */
  transpilePackages: ["shiki"],
  experimental: {
    turbopackFileSystemCacheForBuild: true,
  },
};

const withBotIdConfig = withBotId(nextConfig);

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

export default withNextIntl(withBotIdConfig);
