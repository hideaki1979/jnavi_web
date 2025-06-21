"use client"

import { SelectedToppingInfo } from "@/types/Image"
import { SimulationToppingOption } from "@/types/ToppingCall"
import { imageUploadFormSchema, ImageUploadFormValues, validateFileSizeBeforeCompression } from "@/validations/image"
import { zodResolver } from "@hookform/resolvers/zod"
import { useParams, useRouter } from "next/navigation"
import React, { useCallback, useState } from "react"
import { useForm } from "react-hook-form"
import imageCompression from "browser-image-compression"
import LoadingErrorContainer from "@/components/feedback/LoadingErrorContainer"
import { useAuthStore } from "@/lib/AuthStore"
import { useApiError } from "@/hooks/useApiError"
import { useStoreToppingCallsForImage, useUploadStoreImage } from "@/hooks/api/useImages"
import { useAsyncOperation } from "@/hooks/useAsyncOperation"
import { StoreImageForm } from "@/components/StoreImageForm"

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
    const { isLoading: uploading, execute: executeUpload } = useAsyncOperation<void>()
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
    const handleImageChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
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
    }, [setValue, setError])

    // 画像削除
    const handleImageRemove = useCallback(() => {
        setValue("imageFile", undefined, { shouldValidate: true })
        setImageUrl("")
    }, [setValue])

    // トッピング選択
    const handleOptionChange = useCallback((toppingId: string, optionId: string, storeToppingCallId: string) => {
        setSelectedToppingInfo(prev => ({
            ...prev,
            [toppingId]: { optionId, storeToppingCallId }
        }))
    }, [])

    // 画像ファイルアップロード
    const onSubmit = async (values: ImageUploadFormValues) => {
        clearErrors()
        try {
            await executeUpload(async () => {
                // 画像ファイル必須チェック
                if (!values.imageFile && !imageUrl) {
                    throw new Error("画像ファイルは必須です")
                }
                // ユーザー認証チェックを追加
                if (!user?.uid) {
                    setTimeout(() => router.replace('/auth/login'), 1500)
                    throw new Error("未認証なので、ログインしてください")
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
            })
        } catch (error) {
            setError(error)
        }
    }

    if (toppingIsLoading || toppingIsError) {
        return <LoadingErrorContainer loading={toppingIsLoading} error={toppingIsError ? (toppingError as Error).message : null} />
    }

    return (
        <StoreImageForm
            mode="create"
            formTitle="店舗別画像アップロード"
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
            submitButtonLabel="画像アップロード"
            isSubmitting={uploading}
            onSubmit={handleSubmit(onSubmit)}
        />
    )
}