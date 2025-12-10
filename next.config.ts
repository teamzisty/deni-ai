import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  transpilePackages: ["shiki"],
  experimental: {
    turbopackFileSystemCacheForDev: true,
  },
};

export default nextConfig;
