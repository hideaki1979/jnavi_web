"use server"

import ApiClient from "@/lib/ApiClient";
import { StoreImageUploadData } from "@/types/Image";

const api = ApiClient.getInstance()

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