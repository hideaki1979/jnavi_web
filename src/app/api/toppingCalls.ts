/**
 * トッピングコールオプション関連の Server Action。
 *
 * 実データ取得は toppingCalls.queries.ts の`"use cache"`付き関数に委譲する。
 * 1つのファイルに`"use server"`と`"use cache"`は同居できないため分離しており、
 * ここはクライアント（react-query フック）からの入口を維持するためのラッパ。
 * サーバーコンポーネントは queries 側を直接 import すればよい。
 *
 * エラー時に例外を throw せず、`ActionResult` として結果を返す。
 * Server Action 内で throw された例外は本番ビルドで Next.js にサニタイズされ、
 * APIが返したエラーメッセージ・バリデーション詳細がクライアントへ届かないため。
 * 受け取り側は `unwrapActionResult()` で値の取り出し／例外化を行う。
 */
"use server"

import { getToppingCallOptions as getToppingCallOptionsCached } from "@/app/api/toppingCalls.queries"
import type { ActionResult } from "@/types/actionResult"
import type { ToppingOptionMap } from "@/types/ToppingCall"

/**
 * トッピングコールオプション一覧取得（クライアントからの入口）。
 * @returns トッピングコールオプション一覧を含む処理結果
 */
export const getToppingCallOptions = async (): Promise<ActionResult<ToppingOptionMap>> => {
    return getToppingCallOptionsCached()
}
