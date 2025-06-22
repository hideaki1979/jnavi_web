import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
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
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // 'firebase-admin' をクライアントバンドルから除外する
      config.externals.push('firebase-admin')
    }
    return config
  }
};

export default nextConfig;
