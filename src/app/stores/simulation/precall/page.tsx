"use client"

import LoadingErrorContainer from "@/components/feedback/LoadingErrorContainer"
import { ToppingOptionSelector } from "@/components/simulation/ToppingOptionSelector"
import { useStoreToppingCalls } from "@/hooks/api/useToppingCalls"
import { SelectedSimulationOptions } from "@/types/ToppingCall"
import { generateCallText } from "@/utils/toppingFormatter"
import { ArrowForward, Block } from "@mui/icons-material"
import { Alert, Box, Button, Card, CardMedia, Typography } from "@mui/material"
import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useMemo, useState } from "react"

/**
 * 事前コールシミュレーション画面コンポーネント。
 * - 店舗IDをパラメータとして受け取り、店舗別のトッピングコール情報を取得。
 * - トッピングコール情報を選択できるインターフェースを提供。
 * - 選択されたトッピングコール情報をもとに、コールテキストを生成し、ResultPageに遷移。
 */
export default function PrecallPage() {
    const router = useRouter()
    const params = useSearchParams()
    const id = params.get("id") ?? ""

    const [selectedOptions, setSelectedOptions] = useState<SelectedSimulationOptions>({})
    const [error, setError] = useState<string | null>(null)

    // 店舗別コールトッピング情報取得
    const { data, isLoading, isError, error: queryError } = useStoreToppingCalls(id, "pre_call")

    const preCallOptions = useMemo(
        () => data?.formattedToppingOptions?.map(([, toppingOption]) => toppingOption) ?? []
        , [data])

    const handleOptionChange = useCallback((toppingId: string, optionId: string) => {
        setSelectedOptions(prev => ({
            ...prev,
            [toppingId]: optionId
        }))
    }, [])

    const handleCallOption = useCallback(() => {
        if (Object.keys(selectedOptions).length === 0) {
            setError("オプションが選択されてません。")
            return
        }
        const callText = generateCallText(selectedOptions, preCallOptions)
        router.push(`/stores/simulation/precall-result?callText=${encodeURIComponent(callText)}&id=${id}`)
    }, [selectedOptions, preCallOptions, id, router])

    if (isLoading || isError) {
        return <LoadingErrorContainer loading={isLoading} error={isError ? (queryError as Error).message : null} />
    }

    return (
        <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            px={{ xs: 2, md: 4 }} py={{ xs: 4, md: 8 }}
            sx={{
                maxWidth: "42rem",
                mx: "auto",
                minHeight: "100vh"
            }}
            bgcolor="#cac8c8"
        >
            <Typography
                variant="h6"
                fontWeight="bold"
                className="mb-8"
                sx={(theme) => ({
                    color: theme.palette.mode === "dark" ? theme.palette.primary.light : theme.palette.text.secondary
                })}
            >
                事前コールシミュレーション
            </Typography>


            <Card
                className="mb-8"
                sx={(theme) => ({
                    borderRadius: 4,
                    boxShadow: 6,
                    overflow: "hidden",
                    bgcolor: theme.palette.mode === "dark" ? "grey.900" : "background.paper"

                })}
            >
                <CardMedia
                    component="img"
                    image="/simulation/precall.jpg"
                    alt="事前コールイメージ"
                    style={{ objectFit: "fill", maxHeight: 240 }}
                />
            </Card>
            <Typography
                variant="body1"
                className="mb-8 whitespace-pre-line"
                sx={(theme) => ({
                    color: theme.palette.text.primary
                })}

            >
                行列に並んでいると、店員さんから{"\n"}
                「食券を見せてください」と言われました。{"\n"}
                食券を見せると同時に、{"\n"}
                事前コールしたいオプションを選択しましょう。
            </Typography>
            <ToppingOptionSelector
                options={preCallOptions}
                selectedOptions={selectedOptions}
                onOptionChange={handleOptionChange}
            />
            {/* エラーメッセージ表示 */}
            {
                error && (
                    <Alert severity="error" sx={{ width: "100%", mb: 4 }}>
                        {error}
                    </Alert>
                )
            }
            <Box display="flex" gap={4} mt={8} justifyContent="center" sx={{ width: "100%" }}>
                <Button
                    variant="outlined"
                    startIcon={<Block />}
                    onClick={() => router.push(`/stores/simulation/postcall?id=${id}`)}
                    sx={(theme) => ({
                        borderWidth: 2,
                        fontWeight: "bold",
                        bgcolor: theme.palette.mode === "dark" ? "grey.800" : "background.paper",
                        color: theme.palette.mode === "dark" ? theme.palette.primary.light : theme.palette.secondary.main,
                        "&:hover": {
                            bgcolor: theme.palette.mode === "dark" ? "grey.700" : "grey.100"
                        }
                    })}
                >
                    コール無し
                </Button>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<ArrowForward />}
                    onClick={handleCallOption}
                    sx={{
                        fontWeight: "bold",
                        boxShadow: 6
                    }}
                >
                    コール有り
                </Button>
            </Box>
        </Box >
    )
}