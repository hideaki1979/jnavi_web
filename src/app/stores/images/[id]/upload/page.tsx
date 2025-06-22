"use client"

import { ImageUploadFormValues } from "@/validations/image"
import { useParams, useRouter } from "next/navigation"
import React, { useState } from "react"
import LoadingErrorContainer from "@/components/feedback/LoadingErrorContainer"
import { useAuthStore } from "@/lib/AuthStore"
import { useUploadStoreImage } from "@/hooks/api/useImages"
import { useAsyncOperation } from "@/hooks/useAsyncOperation"
import { StoreImageForm } from "@/components/StoreImageForm"
import { useImageForm } from "@/hooks/useImageForm"

/**
 * 画像アップロード画面
 * @param id 店舗ID
 * @returns 画像アップロード画面
 */
export default function StoreImageUploadPage() {
    const router = useRouter()
    const params = useParams()
    const storeId = params.id as string

    const { isLoading: uploading, execute: executeUpload } = useAsyncOperation<void>()
    const [successMsg, setSuccessMsg] = useState<string>("")
    // AuthStoreからユーザー情報を取得
    const user = useAuthStore((state) => state.user)

    // 画像アップロード用Mutation
    const imageUploadMutation = useUploadStoreImage()

    // 共通フック利用
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
        mode: 'create',
        storeId
    })

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

                const imageData = await createSubmitData(values, user.uid)

                await imageUploadMutation.mutateAsync({ storeId, imageData })
                clearErrors()
                setSuccessMsg("画像ファイルアップロードが成功しました。")
                setTimeout(() => router.push('/stores/map'), 2500)
            })
        } catch (error) {
            setError(error)
        }
    }

    if (isToppingLoading || isToppingError) {
        return <LoadingErrorContainer loading={isToppingLoading} error={toppingErrorMessage} />
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