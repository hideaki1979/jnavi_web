import { createStore, getStoreAll, getStoreById, storeClose, updateStore } from "@/app/api/stores"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { StoreInput } from "@/types/Store"
import { useNotification } from "@/lib/notification"
import { getCurrentUserIdToken } from "@/lib/authToken"
import { unwrapActionResult } from "@/lib/actionResult"
import { ApiClientError } from "@/types/validation"
import { useRouter } from "next/navigation"
import { useEffect, useRef } from "react"

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
        queryFn: async () => unwrapActionResult(await getStoreAll())
    })
}

/**
 * 指定されたIDの店舗情報を取得する
 * @param id 店舗ID
 */
export const useStore = (id: string, enabled: boolean = true) => {
    return useQuery({
        queryKey: storeKeys.detail(id),
        queryFn: async () => unwrapActionResult(await getStoreById(id)),
        enabled: !!id && enabled  // IDがない場合はクエリを実行しない
    })
}

/**
 * 店舗を新規作成する
 */
export const useCreateStore = () => {
    const queryClient = useQueryClient()
    const { showNotification } = useNotification()
    const router = useRouter()
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)

    // フックがアンマウントされる時にタイムアウトをクリア
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [])

    return useMutation({
        mutationFn: async (storeData: StoreInput) => {
            const idToken = await getCurrentUserIdToken()
            return unwrapActionResult(await createStore(storeData, idToken))
        },
        onSuccess: async (data) => {
            // 店舗一覧とマップ情報のキャッシュを無効化
            await queryClient.invalidateQueries({ queryKey: storeKeys.all })
            await queryClient.invalidateQueries({ queryKey: storeKeys.maps })
            showNotification(data, "success")

            // 前のタイムアウトがあればクリア
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }

            timeoutRef.current = setTimeout(() => {
                router.replace('/stores/map')
                timeoutRef.current = null
            }, 1500)
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
    const router = useRouter()
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)

    // フックがアンマウントされる時にタイムアウトをクリア
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [])

    return useMutation({
        mutationFn: async ({ id, storeData }: { id: string; storeData: StoreInput }) => {
            const idToken = await getCurrentUserIdToken()
            return unwrapActionResult(await updateStore(id, storeData, idToken))
        },
        onSuccess: async (data, { id }) => {
            // 更新された店舗の詳細情報、店舗一覧、マップ情報のキャッシュを無効化
            await queryClient.invalidateQueries({ queryKey: storeKeys.detail(id) })
            await queryClient.invalidateQueries({ queryKey: storeKeys.all })
            await queryClient.invalidateQueries({ queryKey: storeKeys.maps })
            showNotification(data, "success")
            // 前のタイムアウトがあればクリア
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
            timeoutRef.current = setTimeout(() => {
                router.replace(`/stores/map`)
                timeoutRef.current = null
            }, 1500)

        },
        onError: (error) => {
            console.error("店舗更新エラー：", error)
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

    return useMutation({
        mutationFn: async ({ id, storeName }: { id: string, storeName: string }) => {
            const idToken = await getCurrentUserIdToken()
            return unwrapActionResult(await storeClose(id, storeName, idToken))
        },
        // 戻り値の message はキャッシュ無効化には不要なため使わない
        onSuccess: async (_, { id }) => {
            // 店舗関連のキャッシュをすべて無効化
            await queryClient.invalidateQueries({ queryKey: storeKeys.detail(id) })
            await queryClient.invalidateQueries({ queryKey: storeKeys.all })
            await queryClient.invalidateQueries({ queryKey: storeKeys.maps })
        },
        onError: (error) => {
            console.error("店舗閉店エラー:", error)
        }
    })
}