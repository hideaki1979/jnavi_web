"use server"

import ApiClient from "@/lib/ApiClient";
import { StoreImageEditData, StoreImageUploadData } from "@/types/Image";

const api = ApiClient.getInstance()

/**
 * 店舗画像アップロードAPI通信を行う関数。
 * - uploadStoreImage: 店舗画像のアップロードAPI呼び出し
 */

export const uploadStoreImage = async (storeId: string | number, imageData: StoreImageUploadData) => {
    try {
        const res = await api.post(`/stores/${storeId}/images`, imageData)
        console.log("動作確認テスト成功しました。")
        return res.data
    } catch (error) {
        throw ApiClient.handlerError(
            error,
            "画像アップロード処理でエラーが発生しました。"
        )
    }
}

/**
 * 店舗画像更新API通信を行う関数。
 * - 画像情報の更新
 * @param storeId 店舗ID
 * @param imageId 画像ID
 * @param imageData 更新する画像データ
 * @returns APIレスポンス
 */

export const updateStoreImage = async (storeId: string | number, imageId: string | number, imageData: StoreImageUploadData) => {
    try {
        const res = await api.put(`/stores/${storeId}/images/${imageId}`, imageData)
        return res.data
    } catch (error) {
        throw ApiClient.handlerError(
            error,
            "店舗画像更新処理でエラーが発生しました。"
        )
    }
}

/**
 * 店舗画像削除API通信を行う関数。
 * - 画像の削除
 * @param storeId 店舗ID
 * @param imageId 画像ID
 * @returns APIレスポンス
 */

export const deleteStoreImage = async (storeId: string | number, imageId: string | number) => {
    try {
        const res = await api.delete(`/stores/${storeId}/images/${imageId}`)
        return res.data
    } catch (error) {
        throw ApiClient.handlerError(
            error,
            "画像削除処理でエラーが発生しました。"
        )
    }
}


/**
 * 店舗IDと画像IDを指定して画像情報を取得するAPI通信を行う関数。
 * - 画像情報取得APIにGETリクエストを送信
 * - 成功時にはAPIレスポンスの画像情報を返す
 * - エラー時にはエラーハンドリングを行う
 * @param storeId 店舗ID
 * @param imageId 画像ID
 * @returns 画像情報
 */

export const getImageById = async (storeId: string | number, imageId: string | number): Promise<StoreImageEditData> => {
    try {
        const res = await api.get(`/stores/${storeId}/images/${imageId}`)
        return res.data.data
    } catch (error) {
        throw ApiClient.handlerError(
            error,
            "画像取得（１件取得）処理でエラーが発生しました。"
        )
    }
}