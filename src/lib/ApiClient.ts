import axios, { AxiosError, AxiosInstance } from "axios"

/**
 * APIクライアントの設定を行うクラス
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
     * エラーハンドラー
     */
    public static handlerError(
        error: unknown,
        defaultMessage: string = "予期せぬエラーが発生しました。"
    ): Error {
        if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError<{ message?: string }>
            return new Error(
                `API呼出中にエラーが発生：${axiosError.response?.data?.message || axiosError.message}`
            )
        }

        if (error instanceof Error) {
            return new Error(`${defaultMessage}：${error.message}`)
        }

        return new Error(defaultMessage)
    }
}

export default ApiClient