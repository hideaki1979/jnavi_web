"use client"

import { usePathname } from 'next/navigation'
import React, { useMemo, useState } from 'react'
import { useAuthStore } from '@/lib/AuthStore'
import { ImageEditFormValues } from '@/validations/image'
import LoadingErrorContainer from '@/components/feedback/LoadingErrorContainer'
import { useUpdateStoreImage } from '@/hooks/api/useImages'
import { useDelayedRedirect } from '@/hooks/useDelayedRedirect'
import { StoreImageForm } from '@/components/image/StoreImageForm'
import { useImageForm } from '@/hooks/useImageForm'
import { StoreImageEditData } from '@/types/Image'
import { SimulationToppingOption } from '@/types/ToppingCall'
import { buildLoginPath } from '@/utils/redirectPath'

interface StoreImageEditFormProps {
    storeId: string;
    imageId: string;
    initialImageData: StoreImageEditData;
    toppingOptions: SimulationToppingOption[]
}

/**
 * 店舗画像の編集フォームを表示し、画像情報の更新を行うコンポーネントです。
 *
 * 店舗ID・画像ID・初期画像データ・トッピング選択肢を受け取り、認証ユーザーによる画像情報の編集・送信・バリデーション・エラー処理・リダイレクトを管理します。
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

    // 未認証時にログイン後の復帰先として渡すため、現在のパスを取得する
    const pathname = usePathname()
    // 遷移はタイマー解除付きのフック経由で行う（アンマウント後の発火を防ぐ）
    const { scheduleRedirect, isRedirectScheduled } = useDelayedRedirect()

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
        initialData: initialDataForForm,
        initialToppingOptions: toppingOptions
    })

    // 画像ファイルアップロード
    const onSubmit = async (values: ImageEditFormValues) => {
        // 前回の送信で残ったAPIエラーを消してから再送信する
        clearErrors()
        setUpdating(true)
        try {
            // 画像ファイル必須チェック
            if (!values.imageFile && !imageUrl) {
                throw new Error("画像ファイルは必須です")
            }
            // ユーザー認証チェック
            if (!user?.uid) {
                setError(new Error("未認証なので、ログインしてください"))
                // ログイン後に元の画面へ戻れるよう redirect_to を付ける（proxyのサーバー側遷移と挙動を揃える）
                scheduleRedirect({ path: buildLoginPath(pathname), delayMs: 1500 })
                return
            }

            const editImageData = await createSubmitData(values, user.uid)
            await updateImageMutation.mutateAsync({ storeId, imageId, imageData: editImageData })
            clearErrors() // 成功時はエラーをクリア
            // 成功トーストを見せてからマップへ遷移する
            scheduleRedirect({ path: '/stores/map', delayMs: 1500 })
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
            // 遷移待ちの間もボタンを押せると、二重送信やタイマーの取り合いになるため止める
            isSubmitting={updating || isRedirectScheduled}
            // 第2引数はクライアント検証で弾かれた時のハンドラ（onSubmitに入らないためここでもAPIエラーを消す）
            onSubmit={handleSubmit(onSubmit, clearErrors)}
        />
    )
}