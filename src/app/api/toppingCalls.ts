/**
 * トッピングコールオプション関連のAPI通信を行う関数群。
 *
 * エラー時に例外を throw せず、`ActionResult` として結果を返す。
 * Server Action 内で throw された例外は本番ビルドで Next.js にサニタイズされ、
 * APIが返したエラーメッセージ・バリデーション詳細がクライアントへ届かないため。
 * 受け取り側は `unwrapActionResult()` で値の取り出し／例外化を行う。
 */
"use server"

import { API_ENDPOINTS } from "@/constants/apiEndpoints"
import ApiClient from "@/lib/ApiClient"
import type { ActionResult } from "@/types/actionResult"
import type { ToppingOptionMap } from "@/types/ToppingCall"

const api = ApiClient.getInstance()

/**
 * トッピングコールオプション取得API通信を行う関数。
 * - getToppingCallOptions: トッピングコールオプション一覧取得
 * @returns トッピングコールオプション一覧を含む処理結果
 */

export const getToppingCallOptions = async (): Promise<ActionResult<ToppingOptionMap>> => {
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
