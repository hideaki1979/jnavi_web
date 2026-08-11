import { Box, Skeleton } from "@mui/material";
import LoadingAnnouncement from "@/components/feedback/LoadingAnnouncement";

interface FormSkeletonProps {
    /** 入力欄を模した行の数。フォームの規模に合わせて調整する */
    fields?: number;
}

/**
 * フォーム画面のローディングUI。
 *
 * 汎用スピナーではなく確定後のレイアウトに近い形を出すことで、
 * データ到着時のレイアウトシフトと「真っ白な待ち時間」を減らす。
 *
 * @param fields 入力欄を模した行の数（既定値: 5）
 */
export default function FormSkeleton({ fields = 5 }: FormSkeletonProps) {
    return (
        <Box
            // 支援技術には「読み込み中」だけを伝え、
            // 装飾でしかない個々のスケルトン矩形は読み上げさせない
            role="status"
            sx={{ maxWidth: "42rem", mx: "auto", px: { xs: 2, md: 4 }, py: { xs: 4, md: 6 }, width: "100%" }}
        >
            <LoadingAnnouncement />
            <Skeleton aria-hidden variant="text" width="40%" sx={{ fontSize: "1.5rem", mb: 4 }} />
            {Array.from({ length: fields }, (_, i) => (
                <Skeleton aria-hidden key={i} variant="rounded" height={56} sx={{ mb: 3 }} />
            ))}
            <Skeleton aria-hidden variant="rounded" height={48} sx={{ mt: 4 }} />
        </Box>
    );
}
