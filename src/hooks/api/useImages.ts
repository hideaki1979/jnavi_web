import { deleteStoreImage, getImageById, updateStoreImage, uploadStoreImage } from "@/app/api/images"
import { getStoreImages, getStoreToppingCalls } from "@/app/api/stores"
import { useNotification } from "@/lib/notification"
import { StoreImageUploadData } from "@/types/Image"
import { ApiClientError } from "@/types/validation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

// クエリキーを一元管理
const imageKeys = {
    all: ['images'] as const,
    store: (storeId: string) => [...imageKeys.all, "store", storeId] as const,
    detail: (storeId: string, imageId: string) => [...imageKeys.store(storeId), imageId] as const,
    storeToppingCalls: (storeId: string) => ["storeToppingCalls", storeId] as const
}

/**
 * 店舗の画像一覧を取得する
 * @param storeId 店舗ID
 */
export const useStoreImages = (storeId: string, enabled: boolean = true) => {
    return useQuery({
        queryKey: imageKeys.store(storeId),
        queryFn: () => getStoreImages(storeId),
        enabled: !!storeId && enabled
    })
}

/**
 * 指定された画像の詳細情報を取得する
 * @param storeId 店舗ID
 * @param imageId 画像ID
 */
export const useStoreImage = (storeId: string, imageId: string) => {
    return useQuery({
        queryKey: imageKeys.detail(storeId, imageId),
        queryFn: () => getImageById(storeId, imageId),
        enabled: !!storeId && !!imageId
    })
}

/**
 * 店舗のトッピングコール情報を取得する（画像アップロード・編集画面で使用）
 * @param storeId 店舗ID
 * @param mode "all" | "pre_call" | "post_call"
 */
export const useStoreToppingCallsForImage = (storeId: string, mode: "all" | "pre_call" | "post_call" = "all") => {
    return useQuery({
        queryKey: [...imageKeys.storeToppingCalls(storeId), mode],
        queryFn: () => getStoreToppingCalls(storeId, mode),
        enabled: !!storeId
    })
}

/**
 * 画像をアップロードする
 */
export const useUploadStoreImage = () => {
    const queryClient = useQueryClient()
    const { showNotification } = useNotification()

    return useMutation({
        mutationFn: ({ storeId, imageData }: { storeId: string, imageData: StoreImageUploadData }) =>
            uploadStoreImage(storeId, imageData),
        onSuccess: async (data, { storeId }) => {
            // 該当店舗の画像一覧キャッシュを無効化
            await queryClient.invalidateQueries({ queryKey: imageKeys.store(storeId) })
            showNotification("画像のアップロードが完了しました。", "success")
        },
        onError: (error) => {
            console.error("画像のアップロードに失敗しました", error)
            const apiError = error as ApiClientError
            showNotification(apiError.message || "画像のアップロードに失敗しました", "error")
        }
    })
}

/**
 * 画像情報を更新する
 */
export const useUpdateStoreImage = () => {
    const queryClient = useQueryClient()
    const { showNotification } = useNotification()

    return useMutation({
        mutationFn: ({ storeId, imageId, imageData }: {
            storeId: string,
            imageId: string,
            imageData: StoreImageUploadData
        }) => updateStoreImage(storeId, imageId, imageData),
        onSuccess: async (data, { storeId, imageId }) => {
            // 画像詳細と一覧のキャッシュを無効化
            await queryClient.invalidateQueries({ queryKey: imageKeys.detail(storeId, imageId) })
            await queryClient.invalidateQueries({ queryKey: imageKeys.store(storeId) })
            showNotification('画像情報更新処理が成功しました', "success")
        },
        onError: (error) => {
            console.error("画像更新処理失敗：", error)
            const apiError = error as ApiClientError
            showNotification(apiError.message || "画像更新処理に失敗しました", "error")
        }
    })
}

/**
 * 画像を削除する
 */
export const useDeleteStoreImage = () => {
    const queryClient = useQueryClient()
    const { showNotification } = useNotification()

    return useMutation({
        mutationFn: ({ storeId, imageId, idToken }: {
            storeId: string,
            imageId: string,
            idToken: string
        }) => deleteStoreImage(storeId, imageId, idToken),
        onSuccess: (data, { storeId }) => {
            // 該当店舗の画像一覧キャッシュを無効化
            queryClient.invalidateQueries({ queryKey: imageKeys.store(storeId) })
            showNotification("画像を削除しました。", "success")
        },
        onError: (error) => {
            console.error("画像削除に失敗しました", error)
            const apiError = error as ApiClientError
            showNotification(apiError.message || "画像削除処理に失敗しました", "error")
        }
    })
}