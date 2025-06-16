"use client"

import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { cleanupSpeechSynthesis } from "@/lib/speech-synthesis";
import { ArrowForward, PauseCircle, PlayCircle, StopCircle } from "@mui/icons-material";
import { Box, Button, IconButton, Typography, useTheme } from "@mui/material";
import { useRouter } from "next/navigation";
interface CallResultScreenProps {
    callText: string;
    nextHref: string;
    nextQuery?: Record<string, string>
}

/**
 * @description
 * 着丼前コールシミュレーションの結果を表示する画面コンポーネント。
 * - urlパラメーター `callText` にコールの内容を指定する
 * - `nextHref` に指定されたURLに遷移するボタンを提供
 * - `nextQuery` に指定されたクエリー文字列を `nextHref` に付与する
 * - 音声合成機能を使用して、コール内容を音声で読み上げる
 * - 音声合成機能がサポートされていないブラウザでは、音声合成非対応ブラウザというテキストを表示
 */
export function CallResultScreen({ callText, nextHref, nextQuery }: CallResultScreenProps) {
    const router = useRouter()
    const theme = useTheme()
    const { speak, cancel, pause, resume, isSpeaking, isPaused, isSupported } = useSpeechSynthesis({
        rate: 0.8,
        pitch: 1.0,
        volume: 1.0
    })

    async function handleSpeech() {
        if (isSpeaking && !isPaused) {
            pause()
            return
        }

        if (isPaused) {
            resume()
            return
        }

        try {
            await speak(callText)
        } catch (error) {
            console.error('音声合成処理エラー：', error)
        }
    }

    function handleStop() {
        cancel()
    }

    function handleNext() {
        // ページ遷移前に音声合成をクリーンアップ
        cleanupSpeechSynthesis()
        const url = nextQuery
            ? `${nextHref}?${new URLSearchParams(nextQuery).toString()}`
            : nextHref
        router.push(url)
    }

    return (
        <Box
            display="flex" flexDirection="column" alignItems="center" justifyContent="center"
            minHeight="100vh" px={4}
            width="100%"
        >
            <Box
                width="100%" maxWidth={560}
                bgcolor="#cac8c8" borderRadius={4} boxShadow={4}
                p={4} display="flex" flexDirection="column" alignItems="center"
                color={theme.palette.text.primary}
            >
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 4, textAlign: "center" }}>
                    事前コール内容
                </Typography>
                <Box display="flex" alignItems="center" mb={4} gap={2}>
                    <IconButton
                        onClick={handleSpeech}
                        color="primary"
                        size="large"
                        aria-label={
                            isSpeaking && !isPaused ? '音声一時停止'
                                : isPaused ? '音声再開'
                                    : "音声再生"
                        }>
                        {isSpeaking && !isPaused ? (
                            <PauseCircle fontSize="large" />
                        ) : (<PlayCircle fontSize="large" />)}
                    </IconButton>
                    {(isSpeaking || isPaused) && (
                        <IconButton
                            onClick={handleStop} color='secondary'
                            size='large' aria-label="音声停止"
                        >
                            <StopCircle fontSize='large' />
                        </IconButton>
                    )}
                    <Typography variant="body1">
                        {isSupported ? (
                            isSpeaking && !isPaused ? '再生中（クリックで一時停止）'
                                : isPaused ? '一時停止中（クリックで再開）'
                                    : '音声読み上げ'
                        ) : (
                            '音声合成非対応ブラウザ'
                        )}
                    </Typography>
                </Box>
                <Typography variant="body1" mb={4} textAlign="center" whiteSpace="pre-line" lineHeight={2}>
                    {callText}
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleNext}
                    className="w-full font-bold"
                    startIcon={<ArrowForward />}
                >
                    {nextQuery ? "着丼前コールへ" : "完食後画面へ"}
                </Button>
            </Box>

        </Box>
    )
}