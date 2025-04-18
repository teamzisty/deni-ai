import type { NextConfig } from "next";
import nextIntlPlugin from "next-intl/plugin";

const withNextIntl = nextIntlPlugin();

const nextConfig: NextConfig = {
  /* config options here */
  transpilePackages: ["@workspace/ui/"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "0t8sk6ibfw.ufs.sh",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
    ]

  }
};

export default withNextIntl(nextConfig);
