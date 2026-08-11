/**
 * 店舗関連の読み取り。
 *
 * `"use server"`ファイル（stores.ts）とは分離している。
 * 1つのファイルに`"use server"`と`"use cache"`は同居できないため。
 * 書き込み・および従来通りクライアントから呼ばれる入口は stores.ts 側に残し、
 * そちらはこのファイルの関数を呼ぶ薄いラッパとする。
 * これによりサーバーコンポーネントも react-query 経由のクライアントも
 * 同じキャッシュを共有できる。
 *
 * 無効化の粒度は「読み手」ではなく「書き手」が決める。
 * 各関数は自分が表すデータのタグだけを宣言し、
 * どのタグをまとめて無効化するかは stores.ts の Server Action 側が判断する。
 *
 * いずれの関数もエラー時に例外を throw せず、`ActionResult` として結果を返す。
 * 受け取り側は `unwrapActionResult()` で値の取り出し／例外化を行う。
 *
 * この「失敗も戻り値」という方針のため、`cacheLife`は成功・失敗で必ず出し分ける。
 * 失敗結果も`use cache`の戻り値としてキャッシュされるので、一律に長い寿命を
 * 与えると一時的なAPI障害の結果が同じキャッシュキーで再利用されてしまう。
 * とくに`unwrapActionResult()`が失敗時にthrowする呼び出し元
 * （/stores/map など）では、バックエンド復旧後もページが落ち続けることになる。
 * `cacheLife`は1回の呼び出しにつき1回だけ実行されればよく、
 * 制御フローの分岐ごとに呼び分けてよい。
 */

import ApiClient from "@/lib/ApiClient"
import type { ActionResult } from "@/types/actionResult"
import type {
    FormattedToppingOptionNameStoreData,
    MapApiResponse,
    MapData,
    SimulationSelectStoresData,
    SimulationSelectToppingCallsData,
    StoreImageDownloadData
} from "@/types/Store"
import { cacheLife, cacheTag } from "next/cache"

const api = ApiClient.getInstance()

/** 店舗の集合（一覧・マップ）を指すタグ。店舗の追加・閉店で無効化する */
export const STORES_TAG = "stores"

/** 特定店舗を指すタグ */
export const storeTag = (id: string | number) => `store-${id}`

/** 特定店舗の画像一覧を指すタグ */
export const storeImagesTag = (storeId: string | number) => `store-${storeId}-images`

/** 特定画像を指すタグ */
export const imageTag = (storeId: string | number, imageId: string | number) =>
    `image-${storeId}-${imageId}`

/**
 * マップ情報を全て取得する。
 * @returns マップ情報を含む処理結果
 */
export const getMapAll = async (): Promise<ActionResult<MapData[]>> => {
    "use cache"
    cacheTag(STORES_TAG)

    try {
        const res = await api.get<MapApiResponse>('/maps')
        cacheLife("hours")
        return { success: true, data: res.data.data }
    } catch (error) {
        // 一時的な障害を長時間キャッシュしないよう、失敗は短命にする
        cacheLife("seconds")
        return {
            success: false,
            error: ApiClient.toActionError(
                error,
                "Map情報取得時にエラーが発生しました。"
            )
        }
    }
}

/**
 * 店舗画像情報を取得する。
 * @param storeId 店舗ID
 * @returns 店舗画像情報を含む処理結果
 */
export const getStoreImages = async (storeId: string): Promise<ActionResult<StoreImageDownloadData[]>> => {
    "use cache"
    cacheTag(storeImagesTag(storeId))

    try {
        const res = await api.get(`/stores/${storeId}/images`)
        cacheLife("hours")
        return { success: true, data: res.data.data || [] }
    } catch (error) {
        // 一時的な障害を長時間キャッシュしないよう、失敗は短命にする
        cacheLife("seconds")
        return {
            success: false,
            error: ApiClient.toActionError(
                error,
                "店舗画像情報取得時にエラーが発生しました。"
            )
        }
    }
}

/**
 * 店舗情報を全件取得する。
 * @returns 店舗情報を含む処理結果
 */
export const getStoreAll = async (): Promise<ActionResult<SimulationSelectStoresData[]>> => {
    "use cache"
    cacheTag(STORES_TAG)

    try {
        const res = await api.get("/stores")
        cacheLife("hours")
        return { success: true, data: res.data.data }
    } catch (error) {
        // 一時的な障害を長時間キャッシュしないよう、失敗は短命にする
        cacheLife("seconds")
        return {
            success: false,
            error: ApiClient.toActionError(
                error,
                "店舗情報全件取得時にエラーが発生しました。"
            )
        }
    }
}

/**
 * 店舗トッピングコール情報を取得する。
 * @param id 店舗ID
 * @param call_timing コールタイミング（事前または着丼前）
 * @returns トッピングコール情報を含む処理結果
 */
export const getStoreToppingCalls = async (id: string, call_timing: string): Promise<ActionResult<SimulationSelectToppingCallsData>> => {
    "use cache"
    cacheTag(storeTag(id))

    try {
        const res = await api.get(`/stores/${id}/toppingCalls`, {
            params: {
                call_timing
            }
        })
        cacheLife("hours")
        return { success: true, data: res.data.data }
    } catch (error) {
        // 一時的な障害を長時間キャッシュしないよう、失敗は短命にする
        cacheLife("seconds")
        return {
            success: false,
            error: ApiClient.toActionError(
                error,
                "店舗トッピングコール情報取得時にエラーが発生しました。"
            )
        }
    }
}

/**
 * 店舗IDを指定して店舗情報を取得する。
 * @param id 店舗ID
 * @returns 店舗情報を含む処理結果
 */
export const getStoreById = async (id: string): Promise<ActionResult<FormattedToppingOptionNameStoreData>> => {
    "use cache"
    cacheTag(storeTag(id))

    try {
        const res = await api.get(`/stores/${id}`)
        cacheLife("hours")
        return { success: true, data: res.data.data }
    } catch (error) {
        // 一時的な障害を長時間キャッシュしないよう、失敗は短命にする
        cacheLife("seconds")
        return {
            success: false,
            error: ApiClient.toActionError(
                error,
                "店舗情報取得時（1件取得）に予期せぬエラーが発生しました"
            )
        }
    }
}
