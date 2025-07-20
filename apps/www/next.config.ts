import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ['image/webp', 'image/avif'],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  experimental: {
    optimizePackageImports: ['@ai-sdk/openai', '@ai-sdk/anthropic', '@ai-sdk/google', '@ai-sdk/xai', '@ai-sdk/groq'],
  },
  serverExternalPackages: ["marked"],
  async headers() {
    return [
      {
        // Apply COOP/COEP headers only to Intellipulse routes for WebContainer
        source: '/intellipulse/:path*',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
        ],
      },
      {
        // Apply COOP/COEP headers to locale-specific Intellipulse routes
        source: '/:locale/intellipulse/:path*',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
        ],
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
