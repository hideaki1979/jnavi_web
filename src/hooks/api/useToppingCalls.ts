import { getStoreToppingCalls } from "@/app/api/stores"
import { getToppingCallOptions } from "@/app/api/toppingCalls"
import { useQuery } from "@tanstack/react-query"

// クエリキーを一元管理
const toppingCallKeys = {
    all: ["toppingCalls"] as const,
    options: ["toppingCallOptions"] as const,
    store: (storeId: string) => [...toppingCallKeys.all, "store", storeId] as const,
    storeWithMode: (storeId: string, mode: string) => [...toppingCallKeys.store(storeId), mode] as const
}

/**
 * トッピングコールオプション一覧を取得する
 */
export const useToppingCallOptions = () => {
    return useQuery({
        queryKey: toppingCallKeys.options,
        queryFn: getToppingCallOptions
    })
}

/*
 * 店舗別のトッピングコール情報を取得する
 * @param storeId 店舗ID
 * @param mode "all" | "pre_call" | "post_call"
 */
export const useStoreToppingCalls = (storeId: string, mode: "all" | "pre_call" | "post_call" = "all") => {
    return useQuery({
        queryKey: toppingCallKeys.storeWithMode(storeId, mode),
        queryFn: () => getStoreToppingCalls(storeId, mode),
        enabled: !!storeId
    })
}