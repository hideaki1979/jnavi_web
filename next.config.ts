import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // `use cache` ディレクティブと実行時プリレンダリングを有効化する。
  // 開発時は Instant Insights が非instantなルートを自動で警告する。
  cacheComponents: true,
  images: {
    // pathname を自プロジェクトの Firebase Storage バケット配下に限定する。
    // hostname だけの許可だと storage.googleapis.com 上の任意の公開バケットが
    // 対象になり、/_next/image?url=... を未認証で叩いて他人の画像を
    // 自サーバの帯域・CPU で最適化させられるため。
    //
    // バケット名はバックエンド（nodedeploytest）の FIREBASE_STORAGE_BUCKET に対応する。
    // Firebase のデフォルトバケット名は 2024年10月以降 `<project>.firebasestorage.app`、
    // それ以前は `<project>.appspot.com` で、どちらも同一 GCP プロジェクトに予約された
    // 名前のため両方許可しても第三者に開放されることはない。
    // 環境ごとに Firebase プロジェクトを分ける場合はここを見直すこと。
    remotePatterns: [
      "jnaviproject.firebasestorage.app",
      "jnaviproject.appspot.com"
    ].map((bucket) => ({
      protocol: "https" as const,
      hostname: "storage.googleapis.com",
      pathname: `/${bucket}/**`
    }))
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb"
    }
  }
};

export default nextConfig;
