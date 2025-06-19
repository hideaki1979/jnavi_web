import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google"
import "./globals.css";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter"
import QueryProviders from "./queryClientProvider";
import { Suspense } from "react";
import LoadingErrorContainer from "@/components/feedback/LoadingErrorContainer";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { NotificationController } from "@/components/feedback/NotificationController";
import { Toaster } from "react-hot-toast";

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  // 日本語フォントを使用するためにweight設定を追加
  weight: ["400", "500", "700"],
  // 必要に応じてpreloadを追加（日本語の場合は多くの文字があるため）
  preload: false
})

export const metadata: Metadata = {
  title: "J-Navi",
  description: "ラーメン二郎系店舗のナビゲーションサイト",
};

/**
 * アプリケーションのルートレイアウトコンポーネント。
 * 
 * - 日本語のフォントを適用したHTMLドキュメントを提供
 * - グローバルな状態管理や認証プロバイダを設定
 * - サスペンスを用いて非同期処理中のローディング状態を表示
 * 
 * @param children - レイアウト内にレンダリングされる子要素
 * @returns JSX.Element
 */

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${notoSansJP.variable} antialiased`}
      >
        <AppRouterCacheProvider options={{ enableCssLayer: true }}>
          <QueryProviders>
            <AuthProvider>
              <NotificationController />
              <Toaster position="top-center" reverseOrder={false} />
              <Suspense fallback={<LoadingErrorContainer loading={true} />}>
                {children}
              </Suspense>
            </AuthProvider>
          </QueryProviders>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
