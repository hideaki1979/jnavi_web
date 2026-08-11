/**
 * トッピングコールオプションの読み取り。
 *
 * `"use server"`ファイル（toppingCalls.ts）とは分離している。
 * 1つのファイルに`"use server"`と`"use cache"`は同居できないため。
 * 書き込み・および従来通りクライアントから呼ばれる入口は toppingCalls.ts 側に残し、
 * そちらはこのファイルの関数を呼ぶ薄いラッパとする。
 * これによりサーバーコンポーネントも react-query 経由のクライアントも
 * 同じキャッシュを共有できる。
 */

import { API_ENDPOINTS } from "@/constants/apiEndpoints"
import ApiClient from "@/lib/ApiClient"
import type { ActionResult } from "@/types/actionResult"
import type { ToppingOptionMap } from "@/types/ToppingCall"
import { cacheLife, cacheTag } from "next/cache"

const api = ApiClient.getInstance()

/** トッピング・コールのマスタを指すキャッシュタグ */
export const TOPPING_CALL_OPTIONS_TAG = "topping-call-options"

/**
 * トッピングコールオプション一覧取得。
 *
 * マスタデータであり更新頻度が低いため`days`で保持する。
 * このアプリからの更新経路が無いため`updateTag`の対象外で、
 * 反映は`cacheLife`の期限切れに委ねる。
 *
 * @returns トッピングコールオプション一覧を含む処理結果
 */
export const getToppingCallOptions = async (): Promise<ActionResult<ToppingOptionMap>> => {
    "use cache"
    cacheTag(TOPPING_CALL_OPTIONS_TAG)
    cacheLife("days")

    try {
        const res = await api.get(API_ENDPOINTS.TOPPING_CALL_OPTIONS_FORMATTED)
        return { success: true, data: res.data.data }
    } catch (error) {
        return {
            success: false,
            error: ApiClient.toActionError(error, "トッピング・コールオプション時にエラーが発生しました。")
        }
    }
}
