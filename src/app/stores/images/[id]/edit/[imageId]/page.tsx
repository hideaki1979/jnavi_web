"use client"

import { useParams, useRouter } from 'next/navigation'
import React, { useEffect, useRef, useState } from 'react'
import { Alert, Box, Button, CircularProgress, Divider, MenuItem, TextField, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { getImageById, updateStoreImage } from '@/app/api/images'
import { useAuthStore } from '@/lib/AuthStore'
import { Controller, useForm } from 'react-hook-form'
import { imageEditFormSchema, ImageEditFormValues, validateFileSizeBeforeCompression } from '@/validations/image'
import { zodResolver } from '@hookform/resolvers/zod'
import { getStoreToppingCalls } from '@/app/api/stores'
import imageCompression from "browser-image-compression"
import { SelectedToppingInfo, StoreImageEditData } from '@/types/Image'
import Image from 'next/image'
import LoadingErrorContainer from '@/components/feedback/LoadingErrorContainer'
import { SimulationToppingOption } from '@/types/ToppingCall'
import { ToppingOptionRadioSelector } from '@/components/toppingCallOptions/ToppingOptionRadioSelector'
import { UI_CONSTANTS } from '@/constants/ui'

const MENU_TYPE = [
    { label: '通常メニュー', value: '1' },
    { label: '限定メニュー', value: '2' }
]

/**
 * 画像編集画面
 * - 店舗IDと画像IDを取得して画像の編集を行う
 */
export default function ImageUpdatePage() {
    // Auth情報からユーザー情報を取得
    const user = useAuthStore((state) => state.user)
    const [imageUrl, setImageUrl] = useState('')
    const [selectedToppingInfo, setSelectedToppingInfo] = useState<Record<string, SelectedToppingInfo>>({})
    const [updating, setUpdating] = useState<boolean>(false)
    const [errorMessage, setErrorMessage] = useState('')
    const [successMsg, setSuccessMsg] = useState<string>("")

    const inputRef = useRef<HTMLInputElement>(null)

    // react-hook-form+zod定義
    const { control, handleSubmit, setValue, formState: { errors }, reset } = useForm<ImageEditFormValues>({
        resolver: zodResolver(imageEditFormSchema),
        defaultValues: {
            menuType: "",
            menuName: "",
            imageFile: undefined
        }
    })

    const router = useRouter()
    const params = useParams()

    // URLパラメータから店舗IDと画像IDを取得
    const storeId = params.id as string
    const imageId = params.imageId as string

    // 画像情報取得
    const { data: imageData, isLoading: isImageLoading, isError: isImageError, error: imageError } = useQuery({
        queryKey: ['getImageInfo', imageId],
        queryFn: () => getImageById(storeId, imageId)
    })

    // トッピングコール情報取得
    const { data: toppingCallData, isLoading: isToppingCallLoading, isError: isToppingCallError, error: toppingCallError } = useQuery({
        queryKey: ['storeToppingCalls', storeId],
        queryFn: () => getStoreToppingCalls(storeId, 'all'),
        enabled: !!storeId
    })

    const toppingOptions: SimulationToppingOption[] = toppingCallData?.formattedToppingOptions?.map(([, opt]) => opt) ?? []

    useEffect(() => {
        if (imageData) {
            const data = imageData as StoreImageEditData

            // フォームフィールドの初期値設定
            reset({
                menuName: data.menu_name,
                menuType: String(data.menu_type),
                imageFile: undefined
            })
            setImageUrl(data.image_url)

            // トッピング選択状態の初期設定
            const initialToppingInfo: Record<string, SelectedToppingInfo> = {}
            data.topping_selections?.forEach((selection) => {
                initialToppingInfo[String(selection.topping_id)] = {
                    optionId: String(selection.call_option_id),
                    storeToppingCallId: String(selection.store_topping_call_id)
                }
            })
            setSelectedToppingInfo(initialToppingInfo)
        }
    }, [imageData, reset])

    // 画像選択・リサイズ
    async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return
        try {
            // ファイル圧縮前のサイズチェック（圧縮前のサイズが２０MBを超えた場合エラー）
            validateFileSizeBeforeCompression(file)

            // ファイル画像圧縮処理
            const compressed = await imageCompression(file, {
                maxWidthOrHeight: 1080,
                maxSizeMB: 5,   // 圧縮後のファイルサイズ
                useWebWorker: true
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
        } catch (err) {
            setErrorMessage(err instanceof Error ? err.message : '画像の最適化に失敗しました。')
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
    async function onSubmit(values: ImageEditFormValues) {
        setUpdating(true)
        try {
            // 画像ファイル必須チェック
            if (!values.imageFile && !imageUrl) {
                setErrorMessage("画像ファイルは必須です")
                setUpdating(false)
                return
            }
            // ユーザー認証チェック
            if (!user?.uid) {
                setErrorMessage("未認証なので、ログインしてください")
                setUpdating(false)
                setTimeout(() => router.replace('/auth/login'), 1500)
                return
            }

            let base64 = null
            if (values.imageFile) {
                base64 = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader()
                    reader.onload = () => resolve(reader.result as string)
                    reader.onerror = reject
                    reader.readAsDataURL(values.imageFile!)
                })
            }

            const toppingSelections = Object.entries(selectedToppingInfo).map(([toppingId, info]) => ({
                topping_id: Number(toppingId),
                call_option_id: Number(info.optionId),
                ...(info.storeToppingCallId ? { store_topping_call_id: info.storeToppingCallId } : {})
            }))

            const editImageData = {
                store_id: storeId,
                user_id: user.uid,
                menu_type: Number(values.menuType),
                menu_name: values.menuName,
                // 既存の画像に変更がない場合は image_base64 フィールドを省略する
                ...(values.imageFile ? { image_base64: base64 } : {}),
                ...(toppingSelections.length > 0 ? { topping_selections: toppingSelections } : {})
            }
            await updateStoreImage(storeId, imageId, editImageData)
            setSuccessMsg('画像情報更新が完了しました')
            setTimeout(() => router.replace(`/stores/map`), 1500)
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "画像情報更新処理に失敗")
        } finally {
            setUpdating(false)
        }
    }

    // 初期表示時のローディング
    const isLoading = isImageLoading || isToppingCallLoading
    const hasError = isImageError || isToppingCallError

    // エラーメッセージを統合
    const getErrorMessage = (): string | null => {
        if (!hasError) return null
        const errors: string[] = []
        if (isImageError && imageError) {
            errors.push(`画像データ取得失敗：${(imageError as Error).message}`)
        }
        if (isToppingCallError && toppingCallError) {
            errors.push(`トッピングコール情報取得失敗：${(toppingCallError as Error).message}`)
        }
        return errors.join('\n')
    }

    if (isLoading || hasError) {
        return <LoadingErrorContainer loading={isLoading} error={getErrorMessage()} />
    }

    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            className='border border-gray-300 shadow-md mx-auto rounded-md p-4 max-w-xl w-full bg-gray-200 text-slate-800'
        >
            <Typography
                variant='h5' fontWeight="bold" className='my-8 text-center'
            >
                画像情報更新
            </Typography>
            {/* 画像選択 */}
            <Box display="flex" flexDirection="column" alignItems="center">
                {imageUrl ? (
                    <Box width="100%" display="flex" flexDirection="column" alignItems="center" mb={2}>
                        <Box position="relative" width="100%" height={UI_CONSTANTS.IMAGE_MODAL.CONTAINER_HEIGHT} className="rounded-md mb-4 overflow-hidden">
                            <Image
                                src={imageUrl}
                                alt='選択したラーメン画像'
                                fill
                                style={{ objectFit: 'contain' }}
                                sizes='(max-width: 768px) 100vw, 50vw'
                                priority
                            />
                        </Box>
                        <Button
                            variant='outlined' color='secondary' onClick={() => {
                                setValue("imageFile", undefined, { shouldValidate: true })
                                setImageUrl("")
                            }}
                        >
                            画像を削除
                        </Button>
                    </Box>
                ) : (
                    <Button variant='outlined' color='primary' component="label"
                        className='mb-2 w-full'
                    >
                        画像を変更
                        <input
                            type="file"
                            hidden
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            onChange={handleImageChange}
                            ref={inputRef}
                        />
                    </Button>
                )}
                {errors.imageFile && (
                    <Typography color='error' variant='body2' className='mt-2'>
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
                    name='menuType' control={control}
                    render={({ field }) => (
                        <TextField
                            select label="メニュータイプ" {...field}
                            fullWidth className='mb-6' size='small' required
                        >
                            {MENU_TYPE.map(menu => (
                                <MenuItem key={menu.value} value={menu.value}>
                                    {menu.label}
                                </MenuItem>
                            ))}
                        </TextField>
                    )}
                />
                <Controller
                    name='menuName' control={control}
                    render={({ field }) => (
                        <TextField
                            label="メニュー名" {...field} placeholder='例：小ラーメン'
                            fullWidth className='mb-6' error={!!errors.menuName}
                            helperText={errors.menuName?.message} size='small'
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

            {/* 成功メッセージ表示 */}
            {successMsg && (
                <Alert severity="success" sx={{ width: "100%", mb: 4 }}>
                    {successMsg}
                </Alert>
            )}
            {/* 更新ボタン */}
            <Box display="flex" justifyContent="center" mt={4}>
                <Button
                    variant='contained'
                    color='primary'
                    type='submit'
                    disabled={updating}
                    className='w-2/3 font-bold py-2'
                >
                    {updating ? <CircularProgress size={24} color='inherit' /> : '画像更新'}
                </Button>
            </Box>
        </form>
    )
}