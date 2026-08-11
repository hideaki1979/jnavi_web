import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // `use cache` ディレクティブと実行時プリレンダリングを有効化する。
  // 開発時は Instant Insights が非instantなルートを自動で警告する。
  cacheComponents: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
        pathname: "**"
      }
    ]
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb"
    }
  }
};

export default nextConfig;
