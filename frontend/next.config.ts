import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: process.cwd(),
  /** Avoids dev-only RSC bundler errors with `segment-explorer-node` / SegmentViewNode (Next 15 + React 19). */
  experimental: {
    devtoolSegmentExplorer: false
  },
  async rewrites() {
    return [
      // Legacy path; prefer TonConnect `manifestUrl` → /api/tonconnect-manifest
      { source: "/tonconnect-manifest.json", destination: "/api/tonconnect-manifest" }
    ];
  }
};

export default nextConfig;

