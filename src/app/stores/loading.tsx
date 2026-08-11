import { Box, CircularProgress, Typography } from "@mui/material";

/**
 * スピナーとラベルを紐づけるためのid。
 * `CircularProgress`は`role="progressbar"`を出力するため、
 * アクセシブルな名前がないと支援技術が用途を判別できない。
 * 文言の二重管理を避けるため、`aria-label`ではなく表示中のラベルを参照する。
 */
const LOADING_LABEL_ID = "stores-loading-label";

/**
 * `/stores`配下のローディングUI。
 *
 * `loading.tsx`は`layout.tsx`の内側で`page.tsx`とその配下を`<Suspense>`で包む。
 * この境界が`StoreLayout`（ヘッダー）より下にあることが重要で、
 * これにより`/stores/**`間のクライアント遷移でもヘッダーを出したまま
 * 本文だけを差し替えられる（ルートレイアウトの境界では発火しなかった）。
 *
 * また、`useSearchParams()`をページ直下で呼ぶシミュレーション系ページに対して
 * プリレンダリング時に必要となるSuspense境界も、この`loading.tsx`が提供する。
 *
 * @returns JSX.Element
 */
export default function StoresLoading() {
    return (
        <Box
            role="status"
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            width="100%"
            sx={{
                // ヘッダー（MUI Toolbarの既定高さ）を差し引いた高さで中央寄せする。
                // 100vhにするとヘッダー分だけ縦スクロールが発生してしまう。
                minHeight: { xs: "calc(100vh - 56px)", sm: "calc(100vh - 64px)" },
            }}
        >
            <CircularProgress color="primary" aria-labelledby={LOADING_LABEL_ID} />
            <Typography id={LOADING_LABEL_ID} variant="body2" sx={{ mt: 2, color: "text.secondary" }}>
                読み込み中...
            </Typography>
        </Box>
    );
}
