import ApiClient from "@/lib/ApiClient";
import { MapApiResponse, MapData, SimulationSelectStoresData, SimulationSelectToppingCallsData, StoreImageDownloadData, StoreInput } from "@/types/Store";

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