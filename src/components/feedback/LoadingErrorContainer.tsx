import { Box, CircularProgress, Typography } from "@mui/material";

/**
 * ローディング・エラー状態の表示コンポーネント。
 * - 読み込み中スピナーやエラーメッセージを表示
 */

interface LoadingErrorContainerProps {
    loading: boolean;
    error?: string | null;
    /**
     * 高さの上書き。
     * 画面全体を占める用途を想定した既定値（loading:100vh / error:40vh）のままだと、
     * ページの一部だけを差し替える用途で使ったときに余白が過大になるため。
     */
    minHeight?: string | number;
}

export default function LoadingErrorContainer({ loading, error, minHeight }: LoadingErrorContainerProps) {
    if (loading) return (
        <Box role="status" display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight={minHeight ?? "100vh"} >
            {/*
              * `CircularProgress`は`role="progressbar"`を出力するため、アクセシブルな名前が必須。
              * このコンポーネントは1画面に複数描画されうる（例: 画像ギャラリーと店舗ドロワー）ので、
              * id参照（`aria-labelledby`）はid重複を招く。ここでは`aria-label`で直接名前を与える。
              */}
            <CircularProgress color="primary" aria-label="Loading" />
            <Typography variant="body2" className="mt-4 text-gray-400">Loading...</Typography>
        </Box>
    )

    if (error) {
        return (
            <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight={minHeight ?? "40vh"}>
                <Typography color="error" component="div" sx={{ whiteSpace: 'pre-line', textAlign: 'center' }}>
                    {error}
                </Typography>
            </Box>
        )
    }

}