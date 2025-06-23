"use client"

import { useRouter } from 'next/navigation'
import React, { useMemo, useState } from 'react'
import { useAuthStore } from '@/lib/AuthStore'
import { ImageEditFormValues } from '@/validations/image'
import LoadingErrorContainer from '@/components/feedback/LoadingErrorContainer'
import { useUpdateStoreImage } from '@/hooks/api/useImages'
import { StoreImageForm } from '@/components/image/StoreImageForm'
import { useImageForm } from '@/hooks/useImageForm'
import { StoreImageEditData } from '@/types/Image'
import { SimulationToppingOption } from '@/types/ToppingCall'

interface StoreImageEditFormProps {
    storeId: string;
    imageId: string;
    initialImageData: StoreImageEditData;
    toppingOptions: SimulationToppingOption[]
}

/**
 * 画像編集画面
 * - 店舗IDと画像IDを取得して画像の編集を行う
 */
export default function StoreImageEditForm({
    storeId,
    imageId,
    initialImageData,
    toppingOptions
}: StoreImageEditFormProps) {
    // Auth情報からユーザー情報を取得
    const user = useAuthStore((state) => state.user)
    // 画像更新用のmutation
    const updateImageMutation = useUpdateStoreImage()
    const [updating, setUpdating] = useState<boolean>(false)

    const router = useRouter()

    const initialDataForForm = useMemo(() => {
        if (!initialImageData) return undefined
        return {
            menuName: initialImageData.menu_name,
            menuType: String(initialImageData.menu_type),
            imageUrl: initialImageData.image_url,
            toppingSelections: initialImageData.topping_selections
        }
    }, [initialImageData])

    const {
        control,
        handleSubmit,
        errors,
        imageUrl,
        handleImageChange,
        handleImageRemove,
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

    if (isToppingLoading || isToppingError) {
        return <LoadingErrorContainer loading={isToppingLoading} error={toppingErrorMessage} />
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