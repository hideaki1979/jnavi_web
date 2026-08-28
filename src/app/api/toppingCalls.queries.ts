/**
 * トッピングコールオプションの読み取り。
 *
 * 呼び出し元はサーバーコンポーネント（/stores/create、/stores/[id]/edit）のみ。
 * かつては`"use server"`ラッパ（toppingCalls.ts）経由でクライアントからも
 * 呼べるようにしていたが、そのフックが未使用だったためラッパごと削除した（#94）。
 *
 * サーバー専用であることを`server-only`で明示する。
 * 理由（穴を塞ぐためではなく意図の固定）は stores.queries.ts のコメントを参照。
 */
import 'server-only'

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
 * マスタデータであり更新頻度が低いため、成功時は`days`で保持する。
 * このアプリからの更新経路が無いため`updateTag`の対象外で、
 * 反映は`cacheLife`の期限切れに委ねる。
 *
 * 失敗結果も`use cache`の戻り値としてキャッシュされる（本プロジェクトは
 * エラーをthrowせず`ActionResult`で返す方針のため）。一律に`days`を与えると
 * 一時的なAPI障害の結果が1日再利用されてしまうので、失敗時は短命にする。
 *
 * @returns トッピングコールオプション一覧を含む処理結果
 */
export const getToppingCallOptions = async (): Promise<ActionResult<ToppingOptionMap>> => {
    "use cache"
    cacheTag(TOPPING_CALL_OPTIONS_TAG)

    try {
        const res = await api.get<unknown>(API_ENDPOINTS.TOPPING_CALL_OPTIONS_FORMATTED)
        // 殻が契約どおりかを検証してから成功として扱う。
        // `cacheLife` の指定より前に置くのは、契約違反を長寿命キャッシュに載せないため
        // （throw して catch 側の `cacheLife("seconds")` に倒す）。
        const envelope = ApiClient.assertEnvelope<ToppingOptionMap>(
            res.data,
            `GET ${API_ENDPOINTS.TOPPING_CALL_OPTIONS_FORMATTED}`
        )
        cacheLife("days")
        return { success: true, data: envelope.data }
    } catch (error) {
        // 一時的な障害を長時間キャッシュしないよう、失敗は短命にする
        cacheLife("seconds")
        return {
            success: false,
            error: ApiClient.toActionError(error, "トッピング・コールオプション時にエラーが発生しました。")
        }
    }
}
