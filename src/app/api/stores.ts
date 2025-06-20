/**
 * 店舗情報・店舗画像・トッピングコール情報など、店舗関連API通信を行う関数群。
 * - 店舗の作成・更新・取得・画像取得
 * - トッピングコール情報取得
 * - 店舗の閉店処理
 */
"use server"

import ApiClient from "@/lib/ApiClient";
import { FormattedToppingOptionNameStoreData, MapApiResponse, MapData, SimulationSelectStoresData, SimulationSelectToppingCallsData, StoreCloseApiRes, StoreImageDownloadData, StoreInput } from "@/types/Store";

const api = ApiClient.getInstance()

/**
 * 店舗情報を登録するAPI通信を行う関数。
 * - 店舗情報登録APIにPOSTリクエストを送信
 * - 成功時にはAPIレスポンスのメッセージを返す
 * - エラー時にはエラーハンドリングを行う
 * @param storeData 店舗情報
 * @returns APIレスポンスのメッセージ
 */
export const createStore = async (
    storeData: StoreInput
): Promise<string> => {
    try {
        const res = await api.post('/stores', storeData)
        return res.data.message
    } catch (error) {
        throw ApiClient.handlerError(
            error,
            "店舗情報登録時にエラーが発生しました。"
        )
    }
}

/**
 * 店舗情報を更新するAPI通信を行う関数。
 * - 店舗情報更新APIにPUTリクエストを送信
 * - 成功時にはAPIレスポンスのメッセージを返す
 * - エラー時にはエラーハンドリングを行う
 * @param storeId 店舗ID
 * @param storeData 更新する店舗情報
 * @returns APIレスポンスのメッセージ
 */

export const updateStore = async (
    storeId: string,
    storeData: StoreInput
): Promise<string> => {
    try {
        const res = await api.put(`/stores/${storeId}`, storeData)
        return res.data.message
    } catch (error) {
        throw ApiClient.handlerError(
            error,
            "店舗情報更新時にエラーが発生しました。"
        )
    }
}

/**
 * マップ情報を全て取得するAPI通信を行う関数。
 * - マップ情報取得APIにGETリクエストを送信
 * - 成功時にはAPIレスポンスのマップ情報を返す
 * - エラー時にはエラーハンドリングを行う
 * @returns マップ情報
 */
export const getMapAll = async (): Promise<MapData[]> => {
    try {
        const res = await api.get<MapApiResponse>('/maps')
        return res.data.data
    } catch (error) {
        throw ApiClient.handlerError(
            error,
            "Map情報取得時にエラーが発生しました。"
        )
    }
}

/**
 * 店舗画像情報を取得するAPI通信を行う関数。
 * - 店舗画像情報取得APIにGETリクエストを送信
 * - 成功時にはAPIレスポンスの店舗画像情報を返す
 * - エラー時にはエラーハンドリングを行う
 * @param storeId 店舗ID
 * @returns 店舗画像情報
 */
export const getStoreImages = async (storeId: string): Promise<StoreImageDownloadData[]> => {
    try {
        const res = await api.get(`/stores/${storeId}/images`)
        return res.data.data || []
    } catch (error) {
        throw ApiClient.handlerError(
            error,
            "店舗画像情報取得時にエラーが発生しました。"
        )
    }
}

/**
 * 店舗情報を取得するAPI通信を行う関数。
 * - 店舗情報取得APIにGETリクエストを送信
 * - 成功時にはAPIレスポンスの店舗情報を返す
 * - エラー時にはエラーハンドリングを行う
 * @returns 店舗情報
 */
export const getStoreAll = async (): Promise<SimulationSelectStoresData[]> => {
    try {
        const res = await api.get("/stores")
        // console.log("Store data:", res.data)
        return res.data.data
    } catch (error) {
        throw ApiClient.handlerError(
            error,
            "店舗情報全件取得時にエラーが発生しました。"
        )
    }
}

/**
 * 店舗トッピングコール情報を取得するAPI通信を行う関数。
 * - 指定した店舗IDとコールタイミングに基づいて、トッピングコール情報を取得
 * - 成功時にはAPIレスポンスのトッピングコール情報を返す
 * - エラー時にはエラーハンドリングを行う
 * @param id 店舗ID
 * @param call_timing コールタイミング（事前または着丼前）
 * @returns トッピングコール情報
 */

export const getStoreToppingCalls = async (id: string, call_timing: string): Promise<SimulationSelectToppingCallsData> => {
    try {
        const res = await api.get(`/stores/${id}/toppingCalls`, {
            params: {
                call_timing
            }
        })
        return res.data.data
    } catch (error) {
        throw ApiClient.handlerError(
            error,
            "店舗トッピングコール情報取得時にエラーが発生しました。"
        )
    }
}

/**
 * 店舗IDを指定して店舗情報を取得するAPI通信を行う関数。
 * - 店舗情報取得APIにGETリクエストを送信
 * - 成功時にはAPIレスポンスの店舗情報を返す
 * - エラー時にはエラーハンドリングを行う
 * @param id 店舗ID
 * @returns 店舗情報
 */
export const getStoreById = async (id: string): Promise<FormattedToppingOptionNameStoreData> => {
    try {
        const res = await api.get(`/stores/${id}`)
        return res.data.data
    } catch (error) {
        throw ApiClient.handlerError(
            error,
            "店舗情報取得時（1件取得）に予期せぬエラーが発生しました"
        )
    }
}

/**
 * 店舗の閉店処理を行うAPI関数
 * @param id 閉店する店舗のID
 * @param storeName 閉店する店舗の店舗名（指定されていない場合は空文字列）
 * @returns 閉店結果のAPIレスポンス
 * @throws 店舗閉店処理でエラーが発生した場合
 */

export const storeClose = async (id: string, storeName: string): Promise<StoreCloseApiRes> => {
    try {
        const res = await api.patch(`/stores/${id}/close`, {
            storeName: storeName
        })
        return res.data
    } catch (error) {
        throw ApiClient.handlerError(
            error,
            "店舗閉店処理時に予期せぬエラーが発生しました"
        )
    }
}        