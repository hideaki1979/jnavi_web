import ApiClient from "@/lib/ApiClient";
import { StoreInput } from "@/types/Store";

const api = ApiClient.getInstance()

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