import { Header } from "@/components/layout/Header";
import { Box } from "@mui/material";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "J-Navi店舗情報",
    description: "J-Naviの店舗情報用の画面です。",
};

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
