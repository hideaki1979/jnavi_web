"use client"

import { Map } from "@mui/icons-material";
import { Box, Button, Skeleton, Typography } from "@mui/material";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

/**
 * AnswerPageコンポーネント
 *
 * - 食後クイズの結果を表示するページ。
 * - クイズの結果に応じて適切なメッセージを表示。
 * - ユーザーが二郎・二郎系店舗の退店ルールを理解できるように案内。
 * - 「Map画面へ」ボタンをクリックすることで、マップページに移動可能。
 *
 * 正解/不正解の表示だけが`?result=`に依存する。
 * 見出し・ルール説明・遷移ボタンは静的なので境界の外に置き、
 * プリレンダリングされた静的シェルに含める。
 *
 * @returns JSX.Element
 */

export default function AnswerPage() {
    const router = useRouter()

    return (
        <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            px={{ xs: 4, md: 8 }} py={{ xs: 4, md: 8 }}
            sx={(theme) => ({
                maxWidth: "42rem",
                mx: "auto",
                minHeight: "100vh",
                color: theme.palette.text.primary
            })}
            bgcolor="#cac8c8"
            width="100%"
        >
            <Typography
                variant="h6"
                fontWeight="bold"
                className="mb-8"
            >
                食後クイズ回答
            </Typography>
            {/*
              * `useSearchParams()`はプリレンダリング時にsuspendするため、
              * 読み取り箇所をこの境界の内側に閉じ込めて残りのシェルを守る。
              * fallbackは確定後のTypography(variant="h4")と同じ行高を占め、
              * 差し替え時のレイアウトシフトを避ける。
              */}
            <Suspense fallback={<Skeleton variant="text" width="6rem" sx={{ fontSize: "2.125rem", mb: 8 }} />}>
                <QuizResult />
            </Suspense>
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

/**
 * クイズの正誤（`?result=`）の表示。
 */
function QuizResult() {
    const params = useSearchParams()
    const result = params.get('result') ?? ''

    return (
        <Typography variant="h4" fontWeight="bold" mb={8}>
            {result}
        </Typography>
    )
}
