"use client"

import { ArrowForward } from "@mui/icons-material";
import { Box, Button, Card, CardMedia, Checkbox, FormControlLabel, FormGroup, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { useState } from "react";

// チェックボックスの項目定義
const checkItemList = [
    { key: "bowl", label: "どんぶりをカウンターにあげる" },
    { key: "tissue", label: "ティッシュをゴミ箱に捨てる" },
    { key: "wipe", label: "テーブルを雑巾で拭く" },
    { key: "nothing", label: "何もせずに退店する" }
] as const

interface CheckItemsState {
    bowl: boolean;
    tissue: boolean;
    wipe: boolean;
    nothing: boolean;
}

/**
 * AfterFinishPage コンポーネント。
 * - 食後のクイズページを表示します。
 * - ユーザーはチェックボックスを使用して、退店時の行動を選択できます。
 * - 正しい選択をした場合、「正解」が表示され、次のページに移動します。
 * - 間違った選択をした場合、「不正解」が表示され、次のページに移動します。
 */

export default function AfterFinishPage() {
    const router = useRouter()

    // チェックボックスの状態管理
    const [checkItems, setCheckItems] = useState<CheckItemsState>({
        bowl: false,
        tissue: false,
        wipe: false,
        nothing: false
    })


    /**
     * チェックボックスの状態を反転する。
     * @param {keyof CheckItemsState} name チェックボックスのname属性
     */
    const handleCheckboxChanged = (name: keyof CheckItemsState) => {
        setCheckItems((prev) => ({
            ...prev,
            [name]: !prev[name]
        }))
    }


    /**
     * 次のページに移動します。
     * - チェックボックスの状態によって「正解」か「不正解」が
     *   クエリー文字列に設定されます。
     */
    const handleNextPage = () => {
        let resultText = ""
        if (checkItems.bowl && checkItems.tissue &&
            checkItems.wipe && !checkItems.nothing) {
            resultText = "正解"
        } else {
            resultText = "不正解"
        }
        router.push(`/stores/simulation/answer?result=${encodeURIComponent(resultText)}`)
    }

    return (
        <Box
            display="flex" flexDirection="column" alignItems="center"
            justifyContent="center" px={{ xs: 2, md: 4 }}
            py={{ xs: 4, md: 8 }} width="100%"
        >
            <Box
                width="100%" maxWidth={560} bgcolor="#cac8c8"
                borderRadius={4}
                sx={(theme) => ({
                    color: theme.palette.text.primary
                })}
                py={2}
            >
                <Typography
                    variant="h6" fontWeight="bold" textAlign="center"
                    mb={{ xs: 2, md: 4 }}
                    pt={4}
                    sx={(theme) => ({
                        color: theme.palette.text.primary
                    })}

                >
                    完食後ルールクイズ
                </Typography>
                <Card
                    sx={(theme) => ({
                        borderRadius: 4,
                        boxShadow: 6,
                        overflow: "hidden",
                        bgcolor: theme.palette.mode === "dark" ? "gray.800" : "gray.100",
                        height: 200, width: 200,
                        mx: "auto", mb: 4
                    })}
                >
                    <CardMedia
                        component="img"
                        image="/simulation/aftermeal.jpg"
                        alt="完食後のどんぶり"
                        style={{ objectFit: "cover" }}
                    />
                </Card>
                <Typography
                    variant="body1" textAlign="center" whiteSpace="pre-line"
                    mb={4}
                >
                    ラーメンを完食しました。{"\n"}
                    退店時にあなたは何をしますか？
                </Typography>
                <FormGroup className="flex flex-col items-start max-w-sm mx-auto gap-2 px-8 mb-8">
                    {checkItemList.map(item => (
                        <FormControlLabel
                            key={item.key}
                            control={
                                <Checkbox />
                            }
                            label={item.label}
                            onChange={() => handleCheckboxChanged(item.key)}
                        />
                    ))}
                </FormGroup>
                <Box display="flex" justifyContent="center">
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleNextPage}
                        startIcon={<ArrowForward />}
                    >
                        回答画面へ
                    </Button>
                </Box>
            </Box>
        </Box>
    )
}
