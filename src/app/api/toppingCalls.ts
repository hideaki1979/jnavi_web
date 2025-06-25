"use server"

import { API_ENDPOINTS } from "@/constants/apiEndpoints"
import ApiClient from "@/lib/ApiClient"

const api = ApiClient.getInstance()

/**
 * トッピングコールオプション取得API通信を行う関数。
 * - getToppingCallOptions: トッピングコールオプション一覧取得
 */

export const getToppingCallOptions = async () => {
    try {
        const res = await api.get(API_ENDPOINTS.TOPPING_CALL_OPTIONS_FORMATTED)
        return res.data.data
    } catch (error) {
        throw ApiClient.handlerError(error, "トッピング・コールオプション時にエラーが発生しました。")
    }
}
