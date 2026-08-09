"use client"

import { ImageUploadFormValues } from "@/validations/image"
import { usePathname } from "next/navigation"
import LoadingErrorContainer from "@/components/feedback/LoadingErrorContainer"
import { useAuthStore } from "@/lib/AuthStore"
import { useUploadStoreImage } from "@/hooks/api/useImages"
import { useAsyncOperation } from "@/hooks/useAsyncOperation"
import { useDelayedRedirect } from "@/hooks/useDelayedRedirect"
import { StoreImageForm } from "@/components/image/StoreImageForm"
import { useImageForm } from "@/hooks/useImageForm"
import { SimulationToppingOption } from "@/types/ToppingCall"
import { buildLoginPath } from "@/utils/redirectPath"

interface StoreImageUploadFormProps {
    storeId: string;
    toppingOptions: SimulationToppingOption[];
}

/**
 * 画像アップロード画面
 * @param id 店舗ID
 * @param toppingOptions トッピングオプション
 * @returns 画像アップロード画面
 */
export default function StoreImageUploadForm({ storeId, toppingOptions }: StoreImageUploadFormProps) {
    // 未認証時にログイン後の復帰先として渡すため、現在のパスを取得する
    const pathname = usePathname()
    // 遷移はタイマー解除付きのフック経由で行う（アンマウント後の発火を防ぐ）
    const { scheduleRedirect, isRedirectScheduled } = useDelayedRedirect()

    const { isLoading: uploading, execute: executeUpload } = useAsyncOperation<void>()
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
                    // ログイン後に元の画面へ戻れるよう redirect_to を付ける（proxyのサーバー側遷移と挙動を揃える）
                    scheduleRedirect({ path: buildLoginPath(pathname), delayMs: 1500 })
                    throw new Error("未認証なので、ログインしてください")
                }

                const imageData = await createSubmitData(values, user.uid)

                await imageUploadMutation.mutateAsync({ storeId, imageData })
                clearErrors()
                // 成功トーストを見せてからマップへ遷移する
                scheduleRedirect({ path: '/stores/map', delayMs: 2500, mode: 'push' })
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
            submitButtonLabel="画像アップロード"
            // 遷移待ちの間もボタンを押せると、二重送信やタイマーの取り合いになるため止める
            isSubmitting={uploading || isRedirectScheduled}
            // 第2引数はクライアント検証で弾かれた時のハンドラ（onSubmitに入らないためここでもAPIエラーを消す）
            onSubmit={handleSubmit(onSubmit, clearErrors)}
        />
    )
}