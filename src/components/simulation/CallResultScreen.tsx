"use client"

import { cancelSpeech, speakText } from "@/lib/speech-synthesis";
import { ArrowForward, PauseCircle, PlayCircle } from "@mui/icons-material";
import { Box, Button, IconButton, Typography, useTheme } from "@mui/material";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
    const [isSpeaking, setIsSpeaking] = useState(false)
    const [isSpeechSupported, setIsSpeechSupported] = useState(false)
    const router = useRouter()
    const theme = useTheme()

    useEffect(() => {
        setIsSpeechSupported(typeof window !== "undefined" && !!window.speechSynthesis)
    }, [])

    function handleSpeech() {
        if (isSpeaking) {
            cancelSpeech()
            setIsSpeaking(false)
            return
        }
        setIsSpeaking(true)
        speakText({
            text: callText,
            onEnd: () => setIsSpeaking(false),
            onError: () => setIsSpeaking(false)
        })
    }

    function handleNext() {
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
                <Box display="flex" alignItems="center" mb={4}>
                    <IconButton onClick={handleSpeech} color="primary" size="large" aria-label="音声再生">
                        {isSpeaking ? <PauseCircle fontSize="large" /> : <PlayCircle fontSize="large" />}
                    </IconButton>
                    <Typography variant="body1" ml={4}>
                        {isSpeechSupported ? "音声読み上げ" : "音声合成非対応ブラウザ"}
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