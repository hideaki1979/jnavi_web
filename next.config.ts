import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // `use cache` ディレクティブと実行時プリレンダリングを有効化する。
  // 開発時は Instant Insights が非instantなルートを自動で警告する。
  cacheComponents: true,
  images: {
    // pathname を Firebase Storage のバケット配下に限定する。
    // hostname だけの許可だと storage.googleapis.com 上の任意の公開バケットが
    // 対象になり、/_next/image?url=... を未認証で叩いて他人の画像を
    // 自サーバの帯域・CPU で最適化させられるため。
    // バケット名はバックエンド（nodedeploytest）の FIREBASE_STORAGE_BUCKET と揃えること。
    remotePatterns: [
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
        pathname: "/jnaviproject.firebasestorage.app/**"
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
