import { getStoreToppingCalls } from "@/app/api/stores"
import { unwrapActionResult } from "@/lib/actionResult"
import { useQuery } from "@tanstack/react-query"

// クエリキーを一元管理
const toppingCallKeys = {
    all: ["toppingCalls"] as const,
    store: (storeId: string) => [...toppingCallKeys.all, "store", storeId] as const,
    storeWithMode: (storeId: string, mode: string) => [...toppingCallKeys.store(storeId), mode] as const
}

/*
 * 店舗別のトッピングコール情報を取得する
 * @param storeId 店舗ID
 * @param mode "all" | "pre_call" | "post_call"
 */
export const useStoreToppingCalls = (storeId: string, mode: "all" | "pre_call" | "post_call" = "all") => {
    return useQuery({
        queryKey: toppingCallKeys.storeWithMode(storeId, mode),
        queryFn: async () => unwrapActionResult(await getStoreToppingCalls(storeId, mode)),
        enabled: !!storeId
    })
}