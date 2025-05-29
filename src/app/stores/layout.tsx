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
            <div className="pt-12 px-8 flex justify-center items-center">
                {children}
            </div>
        </>
    );
}
