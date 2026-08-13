/**
 * 店舗関連の Server Action。
 * - 店舗の作成・更新・閉店（書き込み）
 * - 読み取りは stores.queries.ts の`"use cache"`付き関数へ委譲するラッパ
 *
 * 1つのファイルに`"use server"`と`"use cache"`は同居できないため読み取りを分離した。
 * ここに残しているのはクライアント（react-query フック）からの入口を維持するためで、
 * サーバーコンポーネントは stores.queries.ts を直接 import すればよい。
 * ラッパ経由でもキャッシュ済みの結果が返るため、両者は同じキャッシュを共有する。
 *
 * ラッパは「クライアントから実際に呼ばれるもの」だけを置く。`"use server"`ファイルの
 * export はクライアントから参照された時点で公開POSTエンドポイントとして登録されるため、
 * 使われないラッパを置くと公開面が増えるだけになる（#94 で`getMapAll`を削除した）。
 *
 * 書き込み後は`updateTag`で該当タグを無効化し、自アプリからの更新を即時反映させる
 * （read-your-own-writes）。`updateTag`は Server Action からのみ呼べるため、
 * 無効化の判断はこのファイルが担う。
 * なお本アプリを経由しない更新（モバイルアプリ等）は検知できないため、
 * その追随は stores.queries.ts 側の`cacheLife("hours")`に委ねている。
 *
 * いずれの関数もエラー時に例外を throw せず、`ActionResult` として結果を返す。
 * Server Action 内で throw された例外は本番ビルドで Next.js にサニタイズされ、
 * APIが返したエラーメッセージ・バリデーション詳細がクライアントへ届かないため。
 * 受け取り側は `unwrapActionResult()` で値の取り出し／例外化を行う。
 */
"use server"

import {
    STORES_TAG,
    getStoreAll as getStoreAllCached,
    getStoreById as getStoreByIdCached,
    getStoreImages as getStoreImagesCached,
    getStoreToppingCalls as getStoreToppingCallsCached,
    storeTag
} from "@/app/api/stores.queries";
import ApiClient from "@/lib/ApiClient";
import type { ActionResult } from "@/types/actionResult";
import type { ApiMessageEnvelope } from "@/types/api";
import type { FormattedToppingOptionNameStoreData, SimulationSelectStoresData, SimulationSelectToppingCallsData, StoreImageDownloadData, StoreInput } from "@/types/Store";
import { updateTag } from "next/cache";

const api = ApiClient.getInstance()

/**
 * 店舗情報を登録するAPI通信を行う関数。
 * - 店舗情報登録APIにPOSTリクエストを送信
 * - 成功時にはAPIレスポンスのメッセージを返す
 * - エラー時にはエラー情報を持つ失敗結果を返す
 * @param storeData 店舗情報
 * @param idToken 認証用IDトークン
 * @returns APIレスポンスのメッセージを含む処理結果
 */
export const createStore = async (
    storeData: StoreInput,
    idToken: string
): Promise<ActionResult<string>> => {
    let message: string
    try {
        const res = await api.post('/stores', storeData, {
            headers: {
                'Authorization': `Bearer ${idToken}`
            }
        })
        message = res.data.message
    } catch (error) {
        return {
            success: false,
            error: ApiClient.toActionError(
                error,
                "店舗情報登録時にエラーが発生しました。"
            )
        }
    }

    // 一覧・マップに新店舗を即時反映させる。
    // try の外に置くのは、登録自体は成功しているのに updateTag の失敗を
    // 「登録失敗」として返してしまうと、利用者が再送信して重複登録するため。
    updateTag(STORES_TAG)
    return { success: true, data: message }
}

/**
 * 店舗情報を更新するAPI通信を行う関数。
 * - 店舗情報更新APIにPUTリクエストを送信
 * - 成功時にはAPIレスポンスのメッセージを返す
 * - エラー時にはエラー情報を持つ失敗結果を返す
 * @param storeId 店舗ID
 * @param storeData 更新する店舗情報
 * @param idToken 認証用IDトークン
 * @returns APIレスポンスのメッセージを含む処理結果
 */

export const updateStore = async (
    storeId: string,
    storeData: StoreInput,
    idToken: string
): Promise<ActionResult<string>> => {
    let message: string
    try {
        const res = await api.put(`/stores/${storeId}`, storeData, {
            headers: {
                'Authorization': `Bearer ${idToken}`
            }
        })
        message = res.data.message
    } catch (error) {
        return {
            success: false,
            error: ApiClient.toActionError(
                error,
                "店舗情報更新時にエラーが発生しました。"
            )
        }
    }

    // 店舗詳細に加え、店舗名や位置が変わりうるため一覧・マップも無効化する
    updateTag(storeTag(storeId))
    updateTag(STORES_TAG)
    return { success: true, data: message }
}

/**
 * 店舗の閉店処理を行うAPI関数。
 * - 閉店APIにPATCHリクエストを送信
 * - レスポンス本体（`data`）は使わず、APIレスポンスのメッセージのみを返す
 * - エラー時にはエラー情報を持つ失敗結果を返す
 *
 * @param id 閉店する店舗のID
 * @param storeName 閉店する店舗の店舗名（指定されていない場合は空文字列）
 * @param idToken 認証用IDトークン
 * @returns APIレスポンスのメッセージを含む処理結果
 */

export const storeClose = async (id: string, storeName: string, idToken: string): Promise<ActionResult<string>> => {
    let message: string
    try {
        const res = await api.patch<ApiMessageEnvelope>(`/stores/${id}/close`, {
            storeName
        }, {
            headers: {
                'Authorization': `Bearer ${idToken}`
            }
        })
        message = res.data.message
    } catch (error) {
        return {
            success: false,
            error: ApiClient.toActionError(
                error,
                "店舗閉店処理時に予期せぬエラーが発生しました"
            )
        }
    }

    // 閉店により一覧・マップから消えるため両方を無効化する
    updateTag(storeTag(id))
    updateTag(STORES_TAG)
    return { success: true, data: message }
}

/* ------------------------------------------------------------------
 * 以下は読み取りのラッパ。
 * 実体と`use cache`は stores.queries.ts 側にある。
 * ------------------------------------------------------------------ */

/**
 * 店舗画像情報を取得する（クライアントからの入口）。
 * @param storeId 店舗ID
 * @returns 店舗画像情報を含む処理結果
 */
export const getStoreImages = async (storeId: string): Promise<ActionResult<StoreImageDownloadData[]>> => {
    return getStoreImagesCached(storeId)
}

/**
 * 店舗情報を全件取得する（クライアントからの入口）。
 * @returns 店舗情報を含む処理結果
 */
export const getStoreAll = async (): Promise<ActionResult<SimulationSelectStoresData[]>> => {
    return getStoreAllCached()
}

/**
 * 店舗トッピングコール情報を取得する（クライアントからの入口）。
 * @param id 店舗ID
 * @param call_timing コールタイミング（事前または着丼前）
 * @returns トッピングコール情報を含む処理結果
 */
export const getStoreToppingCalls = async (id: string, call_timing: string): Promise<ActionResult<SimulationSelectToppingCallsData>> => {
    return getStoreToppingCallsCached(id, call_timing)
}

/**
 * 店舗IDを指定して店舗情報を取得する（クライアントからの入口）。
 * @param id 店舗ID
 * @returns 店舗情報を含む処理結果
 */
export const getStoreById = async (id: string): Promise<ActionResult<FormattedToppingOptionNameStoreData>> => {
    return getStoreByIdCached(id)
}
