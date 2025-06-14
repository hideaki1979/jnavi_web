import { ApiClientError, ApiErrorResponse } from "@/types/validation"
import axios, { AxiosError, AxiosInstance } from "axios"

/**
 * axiosを用いたAPIクライアントのシングルトン実装。
 * - APIインスタンスの取得
 * - 共通エラーハンドリング
 */
class ApiClient {
    private static instance: AxiosInstance

    /** 
     * APIクライアントのシングルトンインスタンスを取得
     */
    public static getInstance(): AxiosInstance {
        if (!ApiClient.instance) {
            ApiClient.instance = axios.create({
                baseURL: process.env.NEXT_PUBLIC_API_URL,
                headers: {
                    "Content-Type": "application/json"
                }
            })
        }
        return ApiClient.instance
    }

    /**
     * エラーハンドラー - express-validationのエラー情報に対応
     */
    public static handlerError(
        error: unknown,
        defaultMessage: string = "予期せぬエラーが発生しました。"
    ): ApiClientError {
        if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError<ApiErrorResponse>
            const responseData = axiosError.response?.data

            // APIからのエラーメッセージを優先
            const errorMessage = responseData?.message || axiosError.message

            const customError = new Error(
                `API呼出中にエラー発生：${errorMessage}`
            ) as ApiClientError

            // express-validationのエラー配列があれば追加
            if (responseData?.errors && Array.isArray(responseData.errors)) {
                customError.errors = responseData.errors
            }
            return customError
        }

        if (error instanceof Error) {
            return new Error(`${defaultMessage}：${error.message}`) as ApiClientError
        }

        return new Error(defaultMessage) as ApiClientError
    }
}

export default ApiClient