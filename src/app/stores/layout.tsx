import { Header } from "@/components/layout/Header";
import { Box } from "@mui/material";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "J-Navi店舗情報",
    description: "J-Naviの店舗情報用の画面です。",
};

/**
 * StoreLayout コンポーネント。
 * 
 * - アプリケーションのレイアウトを提供します。
 * - ヘッダーを表示し、子要素をメインコンテンツとして配置します。
 * - フレックスレイアウトを使用して、画面全体に対応するデザインを実現します。
 * 
 * @param {object} props - コンポーネントのプロパティ。
 * @param {React.ReactNode} props.children - メインコンテンツとして表示する子要素。
 * 
 * @returns {JSX.Element} レイアウトコンポーネント。
 */

export default async function StoreLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <>
            {/* <div className="pt-12 px-8 flex justify-center items-center">
                {children}
            </div> */}
            <Box display="flex" flexDirection="column" minHeight="100vh">
                <Header />
                <Box component="main" sx={{ flexGrow: 1, width: "100%" }}>
                    {children}
                </Box>
            </Box>
        </>
    );
}
