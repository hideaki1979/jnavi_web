"use client"

import { useParams, useRouter } from 'next/navigation'
import React, { useCallback, useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/AuthStore'
import { useForm } from 'react-hook-form'
import { imageEditFormSchema, ImageEditFormValues, validateFileSizeBeforeCompression } from '@/validations/image'
import { zodResolver } from '@hookform/resolvers/zod'
import imageCompression from "browser-image-compression"
import { SelectedToppingInfo } from '@/types/Image'
import LoadingErrorContainer from '@/components/feedback/LoadingErrorContainer'
import { SimulationToppingOption } from '@/types/ToppingCall'
import { useApiError } from '@/hooks/useApiError'
import { useStoreImage, useStoreToppingCallsForImage, useUpdateStoreImage } from '@/hooks/api/useImages'
import { StoreImageForm } from '@/components/StoreImageForm'

/**
 * 画像編集画面
 * - 店舗IDと画像IDを取得して画像の編集を行う
 */
export default function ImageUpdatePage() {
    // Auth情報からユーザー情報を取得
    const user = useAuthStore((state) => state.user)
    // 画像更新用のmutation
    const updateImageMutation = useUpdateStoreImage()
    const [imageUrl, setImageUrl] = useState('')
    const [selectedToppingInfo, setSelectedToppingInfo] = useState<Record<string, SelectedToppingInfo>>({})
    const [updating, setUpdating] = useState<boolean>(false)
    const [successMsg, setSuccessMsg] = useState<string>("")

    // API エラーハンドリング
    const { errorMessage, validationErrors, setError, clearErrors } = useApiError()

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
    const { data: imageData, isLoading: isImageLoading, isError: isImageError, error: imageError }
        = useStoreImage(storeId, imageId)

    // トッピングコール情報取得
    const { data: toppingCallData, isLoading: isToppingCallLoading, isError: isToppingCallError, error: toppingCallError }
        = useStoreToppingCallsForImage(storeId)

    const toppingOptions: SimulationToppingOption[]
        = toppingCallData?.formattedToppingOptions?.map(([, opt]) => opt) ?? []

    useEffect(() => {
        if (imageData) {
            const data = imageData

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
    const handleImageChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
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
            setError(err instanceof Error ? err : new Error('画像の最適化に失敗しました'))
        }
    }, [setValue, setError])

    // 画像削除
    const handleImageRemove = useCallback(() => {
        setImageUrl("")
        setValue("imageFile", undefined, { shouldValidate: true })
    }, [setValue])

    // トッピング選択
    const handleOptionChange = useCallback((toppingId: string, optionId: string, storeToppingCallId: string) => {
        setSelectedToppingInfo(prev => ({
            ...prev,
            [toppingId]: { optionId, storeToppingCallId }
        }))
    }, [])

    // 画像ファイルアップロード
    const onSubmit = async (values: ImageEditFormValues) => {
        setUpdating(true)
        try {
            // 画像ファイル必須チェック
            if (!values.imageFile && !imageUrl) {
                throw new Error("画像ファイルは必須です")
            }
            // ユーザー認証チェック
            if (!user?.uid) {
                setError(new Error("未認証なので、ログインしてください"))
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
            await updateImageMutation.mutateAsync({ storeId, imageId, imageData: editImageData })
            clearErrors() // 成功時はエラーをクリア
            setSuccessMsg('画像情報更新が完了しました')
            setTimeout(() => router.replace(`/stores/map`), 1500)
        } catch (error) {
            setError(error)
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
        <StoreImageForm
            mode='edit'
            formTitle='画像情報編集'
            imageUrl={imageUrl}
            onImageChange={handleImageChange}
            onImageRemove={handleImageRemove}
            control={control}
            errors={errors}
            toppingOptions={toppingOptions}
            selectedToppingInfo={selectedToppingInfo}
            onToppingChange={handleOptionChange}
            errorMessage={errorMessage}
            validationErrors={validationErrors}
            successMessage={successMsg}
            submitButtonLabel='画像変更'
            isSubmitting={updating}
            onSubmit={handleSubmit(onSubmit)}
        />
    )
}