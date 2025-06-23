"use client"

import { useParams, useRouter } from 'next/navigation'
import React, { useMemo, useState } from 'react'
import { useAuthStore } from '@/lib/AuthStore'
import { ImageEditFormValues } from '@/validations/image'
import LoadingErrorContainer from '@/components/feedback/LoadingErrorContainer'
import { useStoreImage, useUpdateStoreImage } from '@/hooks/api/useImages'
import { StoreImageForm } from '@/components/image/StoreImageForm'
import { useImageForm } from '@/hooks/useImageForm'

/**
 * 画像編集画面
 * - 店舗IDと画像IDを取得して画像の編集を行う
 */
export default function ImageUpdatePage() {
    // Auth情報からユーザー情報を取得
    const user = useAuthStore((state) => state.user)
    // 画像更新用のmutation
    const updateImageMutation = useUpdateStoreImage()
    const [updating, setUpdating] = useState<boolean>(false)


    const router = useRouter()
    const params = useParams()

    // URLパラメータから店舗IDと画像IDを取得
    const storeId = params.id as string
    const imageId = params.imageId as string

    const { data: imageData, isLoading: isImageLoading, isError: isImageError, error: imageError }
        = useStoreImage(storeId, imageId)


    const initialDataForForm = useMemo(() => {
        if (!imageData) return undefined
        return {
            menuName: imageData.menu_name,
            menuType: String(imageData.menu_type),
            imageUrl: imageData.image_url,
            toppingSelections: imageData.topping_selections
        }
    }, [imageData])

    const {
        control,
        handleSubmit,
        errors,
        imageUrl,
        handleImageChange,
        handleImageRemove,
        toppingOptions,
        selectedToppingInfo,
        handleOptionChange,
        errorMessage,
        validationErrors,
        clearErrors,
        setError,
        isToppingLoading,
        isToppingError,
        toppingErrorMessage,
        createSubmitData
    } = useImageForm({
        mode: 'edit',
        storeId,
        initialData: initialDataForForm
    })

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

            const editImageData = await createSubmitData(values, user.uid)
            await updateImageMutation.mutateAsync({ storeId, imageId, imageData: editImageData })
            clearErrors() // 成功時はエラーをクリア
            setTimeout(() => router.replace(`/stores/map`), 1500)
        } catch (error) {
            setError(error)
        } finally {
            setUpdating(false)
        }
    }

    // 初期表示時のローディング
    const isLoading = isImageLoading || isToppingLoading
    const hasError = isImageError || isToppingError

    // エラーメッセージを統合
    const getErrorMessage = (): string | null => {
        if (!hasError) return null
        const errors: string[] = []
        if (isImageError && imageError) {
            errors.push(`画像データ取得失敗：${(imageError as Error).message}`)
        }
        if (isToppingError && toppingErrorMessage) {
            errors.push(`トッピングコール情報取得失敗：${toppingErrorMessage}`)
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
            submitButtonLabel='画像変更'
            isSubmitting={updating}
            onSubmit={handleSubmit(onSubmit)}
        />
    )
}