import { withLingo } from "@lingo.dev/compiler/next";
import { withBotId } from "botid/next/config";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  transpilePackages: ["shiki"],
  experimental: {
    turbopackFileSystemCacheForBuild: true,
  },
};

const withBotIdConfig = withBotId(nextConfig);

export default async function (): Promise<NextConfig> {
  return await withLingo(withBotIdConfig, {
    sourceRoot: "./src/app",
    sourceLocale: "en",
    targetLocales: ["ja"],
    models: "lingo.dev",
  });
}
