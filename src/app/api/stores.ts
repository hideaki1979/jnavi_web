import ApiClient from "@/lib/ApiClient";
import { FormattedToppingOptionNameStoreData, MapApiResponse, MapData, SimulationSelectStoresData, SimulationSelectToppingCallsData, StoreCloseApiRes, StoreImageDownloadData, StoreInput } from "@/types/Store";

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
            "店舗情報登録時にエラーが発生しました。"
        )
    }
}

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

export const getStoreAll = async (): Promise<SimulationSelectStoresData[]> => {
    try {
        const res = await api.get("/stores")
        console.log(JSON.stringify(res, null, 2))
        return res.data.data
    } catch (error) {
        throw ApiClient.handlerError(
            error,
            "店舗画像情報取得時にエラーが発生しました。"
        )
    }
}

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

export const getStoreById = async (id: string): Promise<FormattedToppingOptionNameStoreData> => {
    try {
        const res = await api.get(`/stores/${id}`)
        return res.data.data
    } catch (error) {
        throw ApiClient.handlerError(
            error,
            "店舗情報取得時に予期せぬエラーが発生しました"
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
            "店舗情報取得時に予期せぬエラーが発生しました"
        )

    }
}