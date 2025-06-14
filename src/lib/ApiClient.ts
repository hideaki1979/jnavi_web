import { ApiClientError, ApiErrorResponse, ExpressValidationError } from "@/types/validation"
import axios, { AxiosError, AxiosInstance } from "axios"

// カスタムエラークラスを追加
class ApiClientErrorImpl extends Error implements ApiClientError {
    public errors?: ExpressValidationError[] | undefined
    public cause?: unknown

    constructor(message: string, errors?: ExpressValidationError[], cause?: unknown) {
        super(message)
        this.name = "ApiClientError"
        this.errors = errors
        this.cause = cause

    }
}

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

            // カスタムエラークラスを使用する
            const customError = new ApiClientErrorImpl(
                `API呼出中にエラー発生：${errorMessage}`,
                responseData?.errors,
                axiosError  // 元のAxiosErrorを保持
            )

            // express-validationのエラー配列があれば追加
            if (responseData?.errors && Array.isArray(responseData.errors)) {
                customError.errors = responseData.errors
            }
            return customError
        }

        if (error instanceof Error) {
            return new ApiClientErrorImpl(`${defaultMessage}：${error.message}`, undefined, error)
        }

        return new ApiClientErrorImpl(defaultMessage)
    }
}

export default ApiClient