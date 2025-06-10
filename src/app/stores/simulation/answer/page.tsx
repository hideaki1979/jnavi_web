"use client"

import { Map } from "@mui/icons-material";
import { Box, Button, Typography, useTheme } from "@mui/material";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * AnswerPageコンポーネント
 *
 * - 食後クイズの結果を表示するページ。
 * - クイズの結果に応じて適切なメッセージを表示。
 * - ユーザーが二郎・二郎系店舗の退店ルールを理解できるように案内。
 * - 「Map画面へ」ボタンをクリックすることで、マップページに移動可能。
 *
 * @returns JSX.Element
 */

export default function AnswerPage() {
    const theme = useTheme()
    const params = useSearchParams()
    const result = params.get('result') ?? ''
    const router = useRouter()

    return (
        <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            px={{ xs: 4, md: 8 }} py={{ xs: 4, md: 8 }}
            sx={{
                maxWidth: "42rem",
                mx: "auto",
                minHeight: "100vh"
            }}
            bgcolor="#cac8c8"
            color={theme.palette.text.primary}
            width="100%"
        >
            <Typography
                variant="h6"
                fontWeight="bold"
                className="mb-8"
            >
                食後クイズ回答
            </Typography>
            <Typography variant="h4" fontWeight="bold" mb={8}>
                {result}
            </Typography>
            <Typography variant="body1" whiteSpace="pre-line" mb={8}>
                二郎・二郎系店舗は退店時に{`\n`}
                ・どんぶりをカウンターにあげる。{`\n`}
                ・ティッシュはゴミ箱に捨てる。{`\n`}
                ・テーブルを雑巾で拭く{`\n`}
                というルールがあります。{`\n\n`}
                二郎のルールはわかりましたでしょうか？{`\n`}
                こちらのシミュレーションで慣れたら{`\n`}
                実際に店舗で実践してみましょう！
            </Typography>
            <Button
                variant="contained"
                color="primary"
                className="mx-auto"
                onClick={() => router.push('/stores/map')}
                startIcon={<Map />}
            >
                Map画面へ
            </Button>

        </Box>
    )
}
