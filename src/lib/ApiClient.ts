import { ApiClientError, ApiErrorResponse, ExpressValidationError } from "@/types/validation"
import axios, { AxiosError, AxiosInstance } from "axios"

// カスタムエラークラスを追加
class ApiClientErrorImpl extends Error implements ApiClientError {
    public errors?: ExpressValidationError[] | undefined
    public cause?: unknown

    constructor(message: string, errors?: ExpressValidationError[], cause?: unknown) {
        super(message, { cause })
        this.name = "ApiClientError"
        this.errors = errors
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
            // バックエンドは { success: false, error: string } 形式で返すため `error` を最優先で読む
            // （`message` は旧形式との互換用フォールバック）
            const errorMessage = responseData?.error || responseData?.message || axiosError.message

            // バリデーションエラーの詳細は `details`（旧形式は `errors`）に入る
            const validationDetails = responseData?.details ?? responseData?.errors

            // カスタムエラークラスを使用する
            const customError = new ApiClientErrorImpl(
                `API呼出中にエラー発生：${errorMessage}`,
                Array.isArray(validationDetails) ? validationDetails : undefined,
                axiosError  // 元のAxiosErrorを保持
            )

            return customError
        }

        if (error instanceof Error) {
            return new ApiClientErrorImpl(`${defaultMessage}：${error.message}`, undefined, error)
        }

        return new ApiClientErrorImpl(defaultMessage)
    }
}

export default ApiClient