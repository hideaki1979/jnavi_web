"use client"

import { SelectedToppingInfo } from "@/types/Image"
import { SimulationToppingOption } from "@/types/ToppingCall"
import { imageUploadFormSchema, ImageUploadFormValues, validateFileSizeBeforeCompression } from "@/validations/image"
import { zodResolver } from "@hookform/resolvers/zod"
import { useParams, useRouter } from "next/navigation"
import React, { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import imageCompression from "browser-image-compression"
import LoadingErrorContainer from "@/components/feedback/LoadingErrorContainer"
import { Alert, Box, Button, CircularProgress, Divider, FormControl, InputLabel, MenuItem, Select, TextField, Typography } from "@mui/material"
import Image from "next/image"
import { ToppingOptionRadioSelector } from "@/components/toppingCallOptions/ToppingOptionRadioSelector"
import { useAuthStore } from "@/lib/AuthStore"
import { ValidationErrorList } from "@/components/feedback/validationErrorList"
import { useApiError } from "@/hooks/useApiError"
import { useStoreToppingCallsForImage, useUploadStoreImage } from "@/hooks/api/useImages"

const MENU_TYPE = [
    { label: "通常メニュー", value: "1" },
    { label: "限定メニュー", value: "2" }
]

/**
 * 画像アップロード画面
 * @param id 店舗ID
 * @returns 画像アップロード画面
 */
export default function StoreImageUploadPage() {
    const router = useRouter()
    const params = useParams()
    const id = params.id as string

    const [imageUrl, setImageUrl] = useState<string>("")
    const [selectedToppingInfo, setSelectedToppingInfo] = useState<Record<string, SelectedToppingInfo>>({})
    const [uploading, setUploading] = useState(false)
    // API エラーハンドリング
    const { errorMessage, validationErrors, setError, clearErrors } = useApiError()
    const [successMsg, setSuccessMsg] = useState<string>("")
    // AuthStoreからユーザー情報を取得
    const user = useAuthStore((state) => state.user)

    // 画像アップロード用Mutation
    const imageUploadMutation = useUploadStoreImage()

    // react-hook-form
    const { control, handleSubmit, setValue, formState: { errors } } = useForm<ImageUploadFormValues>({
        resolver: zodResolver(imageUploadFormSchema),
        defaultValues: {
            menuType: "1",
            menuName: "",
            imageFile: undefined
        }
    })

    // トッピング情報取得
    const { data: toppingCallData, isLoading: toppingIsLoading, isError: toppingIsError, error: toppingError } = useStoreToppingCallsForImage(id)

    const toppingOptions: SimulationToppingOption[] = toppingCallData?.formattedToppingOptions?.map(([, opt]) => opt) ?? []


    // 画像選択・リサイズ
    async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return
        try {
            // ファイル圧縮前のサイズチェック
            validateFileSizeBeforeCompression(file)

            // ファイル画像圧縮処理
            const compressed = await imageCompression(file, {
                maxWidthOrHeight: 1080,
                maxSizeMB: 5,
                useWebWorker: true,
            })
            // Blob→File型に変換
            const compressedFile = compressed instanceof File
                ? compressed
                : new File([compressed], file.name, {
                    type: file.type,
                    lastModified: Date.now()
                })

            setImageUrl(URL.createObjectURL(compressedFile))
            setValue("imageFile", compressedFile, { shouldValidate: true })
        } catch (error) {
            setError(error instanceof Error ? error.message : new Error("画像の最適化に失敗しました"))
        }
    }

    // トッピング選択
    function handleOptionChange(toppingId: string, optionId: string, storeToppingCallId: string) {
        setSelectedToppingInfo(prev => ({
            ...prev,
            [toppingId]: { optionId, storeToppingCallId }
        }))
    }

    // 画像ファイルアップロード
    async function onSubmit(values: ImageUploadFormValues) {
        setUploading(true)
        try {
            if (!values.imageFile) {
                setError(new Error("画像ファイルは必須です"))
                setUploading(false)
                return
            }

            // ユーザー認証チェックを追加
            if (!user?.uid) {
                setError(new Error("未認証なので、ログインしてください"))
                setUploading(false)
                setTimeout(() => router.replace('/auth/login'), 1500)
                return // ここで処理を停止
            }

            const base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader()
                reader.onload = () => resolve(reader.result as string)
                reader.onerror = reject
                reader.readAsDataURL(values.imageFile!)
            })
            const toppingSelections = Object.entries(selectedToppingInfo).map(([toppingId, info]) => ({
                topping_id: Number(toppingId),
                call_option_id: Number(info.optionId),
                ...(info.storeToppingCallId ? { store_topping_call_id: info.storeToppingCallId } : {})
            }))

            const imageData = {
                store_id: id,
                user_id: user?.uid,
                menu_type: Number(values.menuType),
                menu_name: values.menuName,
                image_base64: base64,
                ...(toppingSelections.length > 0 ? { topping_selections: toppingSelections } : {})
            }

            await imageUploadMutation.mutateAsync({ storeId: id, imageData })
            clearErrors()
            setSuccessMsg("画像ファイルアップロードが成功しました。")
            setTimeout(() => router.push('/stores/map'), 2500)
        } catch (error) {
            setError(error)
        } finally {
            setUploading(false)
        }
    }

    if (toppingIsLoading || toppingIsError) {
        return <LoadingErrorContainer loading={toppingIsLoading} error={toppingIsError ? (toppingError as Error).message : null} />
    }

    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            className="border border-gray-300 shadow-md mx-auto rounded-md p-4 max-w-xl w-full bg-gray-200 text-slate-800"
        >
            <Typography variant="h5" fontWeight="bold" className="my-8 text-center">
                店舗別画像アップロード
            </Typography>

            {/* 画像選択 */}
            <Box display="flex" flexDirection="column" alignItems="center">
                {imageUrl ? (
                    <Box width="100%" display="flex" flexDirection="column" alignItems="center" mb={2}>
                        <Box position="relative" width="280px" height="160px" className="rounded-md mb-4 overflow-hidden">
                            <Image
                                src={imageUrl}
                                alt="選択したラーメン画像"
                                fill
                                style={{ objectFit: "contain" }}
                            />
                        </Box>
                        <Button variant="outlined" color="secondary" onClick={() => {
                            setValue("imageFile", undefined as unknown as File, { shouldValidate: true })
                            setImageUrl("")
                        }}>
                            画像を削除
                        </Button>
                    </Box>
                ) : (
                    <label htmlFor="image-upload-input">
                        <Button
                            variant="contained"
                            component="span"
                            className="w-full mb-2"
                        >
                            画像を選択
                            <input
                                id="image-upload-input"
                                type="file"
                                accept="image/jpeg,image/png,image/gif,image/webp"
                                hidden
                                onChange={handleImageChange}
                            />
                        </Button>
                    </label>
                )}
                {errors.imageFile && (
                    <Typography color="error" variant='body2' className='mt-2'>
                        {errors.imageFile.message}
                    </Typography>
                )}
            </Box>
            <Divider className="my-4" />
            {/* メニュー情報 */}
            <Typography variant="subtitle1" fontWeight="bold" mb={4}>
                メニュー情報
            </Typography>
            <Box mb={2}>
                <Controller
                    name="menuType" control={control}
                    render={({ field }) => (
                        <FormControl fullWidth size="small" required>
                            <InputLabel
                                id="menu-type-label"
                            >メニュータイプ
                            </InputLabel>
                            <Select
                                {...field}
                                labelId="menu-type-label"
                                id="menu-type"
                                label="メニュータイプ"
                                fullWidth
                                className="mb-4"
                            >
                                {MENU_TYPE.map(menu => (
                                    <MenuItem key={menu.value} value={menu.value}>
                                        {menu.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}
                />
                <Controller
                    name="menuName"
                    control={control}

                    render={({ field }) => (
                        <TextField
                            label="メニュー名" {...field} placeholder="小ラーメン"
                            fullWidth className="mb-4" error={!!errors.menuName}
                            helperText={errors.menuName?.message} size="small"
                        />
                    )}
                />
            </Box>
            {/* トッピングオプション */}
            {toppingOptions.length > 0 && (
                <>
                    <Typography variant="subtitle1" fontWeight="bold" className="mb-4">
                        トッピングコールオプション
                    </Typography>
                    <ToppingOptionRadioSelector
                        options={toppingOptions}
                        selectedOptions={selectedToppingInfo}
                        onOptionChange={handleOptionChange}
                    />
                </>
            )}
            {/* エラーメッセージ表示 */}
            {errorMessage && (
                <Alert severity="error" sx={{ width: "100%", mb: 4 }}>
                    {errorMessage}
                </Alert>
            )}

            {/* バリデーションエラー表示 */}
            <ValidationErrorList errors={validationErrors} />

            {/* 成功メッセージ表示 */}
            {successMsg && (
                <Alert severity="success" sx={{ width: "100%", mb: 4 }}>
                    {successMsg}
                </Alert>
            )}

            {/* アップロードボタン */}
            <Box display="flex" justifyContent="center" mt={6}>
                <Button
                    variant="contained"
                    color="primary"
                    type="submit"
                    disabled={uploading}
                    className="w-2/3 font-bold py-2"
                >
                    {uploading ? <CircularProgress size={24} color="inherit" /> : "画像アップロード"}
                </Button>
            </Box>
        </form>
    )
}