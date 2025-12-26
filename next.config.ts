import { withBotId } from "botid/next/config";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  transpilePackages: ["shiki"],
  experimental: {
    turbopackFileSystemCacheForBuild: true,
  },
};

export default withBotId(nextConfig);
