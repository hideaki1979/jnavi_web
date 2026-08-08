/**
 * 店舗情報・店舗画像・トッピングコール情報など、店舗関連API通信を行う関数群。
 * - 店舗の作成・更新・取得・画像取得
 * - トッピングコール情報取得
 * - 店舗の閉店処理
 *
 * いずれの関数もエラー時に例外を throw せず、`ActionResult` として結果を返す。
 * Server Action 内で throw された例外は本番ビルドで Next.js にサニタイズされ、
 * APIが返したエラーメッセージ・バリデーション詳細がクライアントへ届かないため。
 * 受け取り側は `unwrapActionResult()` で値の取り出し／例外化を行う。
 */
"use server"

import ApiClient from "@/lib/ApiClient";
import type { ActionResult } from "@/types/actionResult";
import type { FormattedToppingOptionNameStoreData, MapApiResponse, MapData, SimulationSelectStoresData, SimulationSelectToppingCallsData, StoreCloseApiRes, StoreImageDownloadData, StoreInput } from "@/types/Store";

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
    try {
        const res = await api.post('/stores', storeData, {
            headers: {
                'Authorization': `Bearer ${idToken}`
            }
        })
        return { success: true, data: res.data.message }
    } catch (error) {
        return {
            success: false,
            error: ApiClient.toActionError(
                error,
                "店舗情報登録時にエラーが発生しました。"
            )
        }
    }
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
    try {
        const res = await api.put(`/stores/${storeId}`, storeData, {
            headers: {
                'Authorization': `Bearer ${idToken}`
            }
        })
        return { success: true, data: res.data.message }
    } catch (error) {
        return {
            success: false,
            error: ApiClient.toActionError(
                error,
                "店舗情報更新時にエラーが発生しました。"
            )
        }
    }
}

/**
 * マップ情報を全て取得するAPI通信を行う関数。
 * - マップ情報取得APIにGETリクエストを送信
 * - 成功時にはAPIレスポンスのマップ情報を返す
 * - エラー時にはエラー情報を持つ失敗結果を返す
 * @returns マップ情報を含む処理結果
 */
export const getMapAll = async (): Promise<ActionResult<MapData[]>> => {
    try {
        const res = await api.get<MapApiResponse>('/maps')
        return { success: true, data: res.data.data }
    } catch (error) {
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
 * 店舗画像情報を取得するAPI通信を行う関数。
 * - 店舗画像情報取得APIにGETリクエストを送信
 * - 成功時にはAPIレスポンスの店舗画像情報を返す
 * - エラー時にはエラー情報を持つ失敗結果を返す
 * @param storeId 店舗ID
 * @returns 店舗画像情報を含む処理結果
 */
export const getStoreImages = async (storeId: string): Promise<ActionResult<StoreImageDownloadData[]>> => {
    try {
        const res = await api.get(`/stores/${storeId}/images`)
        return { success: true, data: res.data.data || [] }
    } catch (error) {
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
 * 店舗情報を取得するAPI通信を行う関数。
 * - 店舗情報取得APIにGETリクエストを送信
 * - 成功時にはAPIレスポンスの店舗情報を返す
 * - エラー時にはエラー情報を持つ失敗結果を返す
 * @returns 店舗情報を含む処理結果
 */
export const getStoreAll = async (): Promise<ActionResult<SimulationSelectStoresData[]>> => {
    try {
        const res = await api.get("/stores")
        return { success: true, data: res.data.data }
    } catch (error) {
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
 * 店舗トッピングコール情報を取得するAPI通信を行う関数。
 * - 指定した店舗IDとコールタイミングに基づいて、トッピングコール情報を取得
 * - 成功時にはAPIレスポンスのトッピングコール情報を返す
 * - エラー時にはエラー情報を持つ失敗結果を返す
 * @param id 店舗ID
 * @param call_timing コールタイミング（事前または着丼前）
 * @returns トッピングコール情報を含む処理結果
 */

export const getStoreToppingCalls = async (id: string, call_timing: string): Promise<ActionResult<SimulationSelectToppingCallsData>> => {
    try {
        const res = await api.get(`/stores/${id}/toppingCalls`, {
            params: {
                call_timing
            }
        })
        return { success: true, data: res.data.data }
    } catch (error) {
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
 * 店舗IDを指定して店舗情報を取得するAPI通信を行う関数。
 * - 店舗情報取得APIにGETリクエストを送信
 * - 成功時にはAPIレスポンスの店舗情報を返す
 * - エラー時にはエラー情報を持つ失敗結果を返す
 * @param id 店舗ID
 * @returns 店舗情報を含む処理結果
 */
export const getStoreById = async (id: string): Promise<ActionResult<FormattedToppingOptionNameStoreData>> => {
    try {
        const res = await api.get(`/stores/${id}`)
        return { success: true, data: res.data.data }
    } catch (error) {
        return {
            success: false,
            error: ApiClient.toActionError(
                error,
                "店舗情報取得時（1件取得）に予期せぬエラーが発生しました"
            )
        }
    }
}

/**
 * 店舗の閉店処理を行うAPI関数
 * @param id 閉店する店舗のID
 * @param storeName 閉店する店舗の店舗名（指定されていない場合は空文字列）
 * @param idToken 認証用IDトークン
 * @returns 閉店結果のAPIレスポンスを含む処理結果
 */

export const storeClose = async (id: string, storeName: string, idToken: string): Promise<ActionResult<StoreCloseApiRes>> => {
    try {
        const res = await api.patch(`/stores/${id}/close`, {
            storeName: storeName
        }, {
            headers: {
                'Authorization': `Bearer ${idToken}`
            }
        })
        return { success: true, data: res.data }
    } catch (error) {
        return {
            success: false,
            error: ApiClient.toActionError(
                error,
                "店舗閉店処理時に予期せぬエラーが発生しました"
            )
        }
    }
}
