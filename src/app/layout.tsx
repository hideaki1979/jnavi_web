import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { AuthProvider } from "@/components/auth/AuthProvider";
import QueryClientProviders from "./queryClientProvider";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { NotificationController } from "@/components/feedback/NotificationController";
import theme from "@/theme";
import { Suspense } from 'react'
import LoadingErrorContainer from '@/components/feedback/LoadingErrorContainer'
import { Toaster } from 'react-hot-toast'

const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-roboto",
});

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
    <html lang="ja" className={roboto.variable}>
      <body className={`${roboto.className} antialiased`}>
        <AppRouterCacheProvider options={{ enableCssLayer: true }}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <QueryClientProviders>
              <AuthProvider>
                <NotificationController />
                <Toaster position="top-center" reverseOrder={false} />
                <Suspense fallback={<LoadingErrorContainer loading={true} />}>
                  {children}
                </Suspense>
              </AuthProvider>
            </QueryClientProviders>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
