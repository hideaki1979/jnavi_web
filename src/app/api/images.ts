"use server"

import ApiClient from "@/lib/ApiClient";
import { StoreImageUploadData } from "@/types/Image";

const api = ApiClient.getInstance()

/**
 * 店舗画像アップロードAPI通信を行う関数。
 * - uploadStoreImage: 店舗画像のアップロードAPI呼び出し
 */

export const uploadStoreImage = async (storeId: string | number, imageData: StoreImageUploadData) => {
    try {
        const res = await api.post(`/stores/${storeId}/images`, imageData)
        return res.data.data
    } catch (error) {
        throw ApiClient.handlerError(
            error,
            "画像アップロード処理でエラーが発生しました。"
        )
    }
}