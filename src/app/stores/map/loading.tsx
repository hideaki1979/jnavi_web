import { Box, Skeleton } from "@mui/material";
import LoadingAnnouncement from "@/components/feedback/LoadingAnnouncement";

/**
 * 店舗マップ画面のローディングUI。
 *
 * マップは画面全体を占める矩形なので、フォーム用スケルトンではなく
 * ヘッダーを除いた領域を埋める一枚の矩形で確定後の形に寄せる。
 */
export default function StoreMapLoading() {
    return (
        <Box
            role="status"
            sx={{
                width: "100%",
                // ヘッダー（MUI Toolbarの既定高さ）を差し引く
                height: { xs: "calc(100vh - 56px)", sm: "calc(100vh - 64px)" },
            }}
        >
            <LoadingAnnouncement />
            {/* 矩形は装飾。読み込み中であることはLoadingAnnouncementが伝える */}
            <Skeleton aria-hidden variant="rectangular" width="100%" height="100%" />
        </Box>
    );
}
