/**
 * 店舗画像の読み取り。
 *
 * `"use server"`ファイル（images.ts）とは分離している。
 * 1つのファイルに`"use server"`と`"use cache"`は同居できないため。
 * 分離の意図と全体構成は stores.queries.ts のコメントを参照。
 *
 * エラー時に例外を throw せず、`ActionResult` として結果を返す。
 * 受け取り側は `unwrapActionResult()` で値の取り出し／例外化を行う。
 *
 * サーバー専用であることを`server-only`で明示する。
 * 理由（穴を塞ぐためではなく意図の固定）は stores.queries.ts のコメントを参照（#94）。
 */
import 'server-only'

import { imageTag } from "@/app/api/stores.queries"
import ApiClient from "@/lib/ApiClient"
import type { ActionResult } from "@/types/actionResult"
import type { ApiEnvelope } from "@/types/api"
import type { StoreImageEditData } from "@/types/Image"
import { cacheLife, cacheTag } from "next/cache"

const api = ApiClient.getInstance()

/**
 * 店舗IDと画像IDを指定して画像情報を取得する。
 * @param storeId 店舗ID
 * @param imageId 画像ID
 * @returns 画像情報を含む処理結果
 */
export const getImageById = async (storeId: string | number, imageId: string | number): Promise<ActionResult<StoreImageEditData>> => {
    "use cache"
    cacheTag(imageTag(storeId, imageId))

    try {
        const res = await api.get<ApiEnvelope<StoreImageEditData>>(`/stores/${storeId}/images/${imageId}`)
        cacheLife("hours")
        return { success: true, data: res.data.data }
    } catch (error) {
        // 一時的な障害を長時間キャッシュしないよう、失敗は短命にする
        cacheLife("seconds")
        return {
            success: false,
            error: ApiClient.toActionError(
                error,
                "画像取得（１件取得）処理でエラーが発生しました。"
            )
        }
    }
}
