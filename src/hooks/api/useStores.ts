import { createStore, getMapAll, getStoreAll, getStoreById, storeClose, updateStore } from "@/app/api/stores"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { StoreInput } from "@/types/Store"
import { useNotification } from "@/lib/notification"
import { ApiClientError } from "@/types/validation"

// クエリキーを一元管理
const storeKeys = {
    all: ["stores"] as const,
    list: ["stores", "list"] as const,
    maps: ["maps"] as const,
    details: () => [...storeKeys.all, "detail"] as const,
    detail: (id: string) => [...storeKeys.details(), id] as const
}

/**
 * 全店舗情報を取得する（シミュレーション画面用）
 */
export const useAllStores = () => {
    return useQuery({
        queryKey: storeKeys.list,
        queryFn: getStoreAll
    })
}

/**
 * マップに表示する全店舗情報を取得する
 */
export const useStoresForMap = () => {
    return useQuery({
        queryKey: storeKeys.maps,
        queryFn: getMapAll
    })
}

/**
 * 指定されたIDの店舗情報を取得する
 * @param id 店舗ID
 */
export const useStore = (id: string) => {
    return useQuery({
        queryKey: storeKeys.detail(id),
        queryFn: () => getStoreById(id),
        enabled: !!id   // IDがない場合はクエリを実行しない
    })
}

/**
 * 店舗を新規作成する
 */
export const useCreateStore = () => {
    const queryClient = useQueryClient()
    const { showNotification } = useNotification()

    return useMutation({
        mutationFn: (storeData: StoreInput) => createStore(storeData),
        onSuccess: (data) => {
            // 店舗一覧とマップ情報のキャッシュを無効化
            queryClient.invalidateQueries({ queryKey: storeKeys.all })
            queryClient.invalidateQueries({ queryKey: storeKeys.maps })
            showNotification(data, "success")
        },
        onError: (error) => {
            const apiError = error as ApiClientError
            showNotification(apiError.message || "店舗の作成に失敗しました", "error")
        }
    })
}

/**
 * 店舗情報を更新する
 */
export const useUpdateStore = () => {
    const queryClient = useQueryClient()
    const { showNotification } = useNotification()

    return useMutation({
        mutationFn: ({ id, storeData }: { id: string; storeData: StoreInput }) =>
            updateStore(id, storeData),
        onSuccess: (data, { id }) => {
            // 更新された店舗の詳細情報、店舗一覧、マップ情報のキャッシュを無効化
            queryClient.invalidateQueries({ queryKey: storeKeys.detail(id) })
            queryClient.invalidateQueries({ queryKey: storeKeys.all })
            queryClient.invalidateQueries({ queryKey: storeKeys.maps })
            showNotification(data, "success")
        },
        onError: (error) => {
            const apiError = error as ApiClientError
            showNotification(apiError.message || "店舗の更新に失敗しました", "error")
        }
    })
}

/**
 * 店舗を閉店する
 */
export const useCloseStore = () => {
    const queryClient = useQueryClient()
    const { showNotification } = useNotification()

    return useMutation({
        mutationFn: ({ id, storeName }: { id: string; storeName: string }) =>
            storeClose(id, storeName),
        onSuccess: (data, { id }) => {
            // 閉店した店舗の詳細情報、店舗一覧、マップ情報のキャッシュを無効化
            queryClient.invalidateQueries({ queryKey: storeKeys.detail(id) })
            queryClient.invalidateQueries({ queryKey: storeKeys.all })
            queryClient.invalidateQueries({ queryKey: storeKeys.maps })
            showNotification(data.message, "success")
        },
        onError: (error) => {
            const apiError = error as ApiClientError
            showNotification(apiError.message || "店舗の閉店処理に失敗しました", "error")
        }
    })
}