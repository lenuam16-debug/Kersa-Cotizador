import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Required for Cloudflare Pages (Edge Runtime)
  },
};

export default nextConfig;
