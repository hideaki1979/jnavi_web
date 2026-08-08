import { ActionErrorPayload } from "@/types/actionResult"
import { ApiErrorResponse } from "@/types/validation"
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
     *
     * API呼び出しで発生した例外を、Server Action の戻り値として返せる
     * シリアライズ可能なエラー情報（{@link ActionErrorPayload}）へ変換する。
     * Server Action 内で throw すると本番ビルドでメッセージがサニタイズされ
     * クライアントへ届かないため、例外ではなく戻り値としてエラーを伝搬させる。
     *
     * @param error 発生した例外
     * @param defaultMessage axiosエラー以外の場合に使用するメッセージ
     * @returns Server Action の戻り値に載せるエラー情報
     */
    public static toActionError(
        error: unknown,
        defaultMessage: string = "予期せぬエラーが発生しました。"
    ): ActionErrorPayload {
        if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError<ApiErrorResponse>
            const responseData = axiosError.response?.data

            // APIからのエラーメッセージを優先
            // バックエンドは { success: false, error: string } 形式で返すため `error` を最優先で読む
            // （`message` は旧形式との互換用フォールバック）
            const errorMessage = responseData?.error || responseData?.message || axiosError.message

            // バリデーションエラーの詳細は `details`（旧形式は `errors`）に入る
            const validationDetails = responseData?.details ?? responseData?.errors

            const status = axiosError.response?.status

            const payload: ActionErrorPayload = {
                message: `API呼出中にエラー発生：${errorMessage}`,
                errors: Array.isArray(validationDetails) ? validationDetails : undefined,
                status
            }

            // 画面には message のみ表示するため、原因調査に必要な全情報はここでログに残す。
            // ※ AxiosError そのものは出力しない（リクエストヘッダーの認証トークンまでログに残るため）
            console.error(`[ApiClient] ${defaultMessage}`, JSON.stringify({
                method: axiosError.config?.method,
                url: axiosError.config?.url,
                status,
                response: responseData,
                payload
            }))

            return payload
        }

        if (error instanceof Error) {
            const payload: ActionErrorPayload = { message: `${defaultMessage}：${error.message}` }
            console.error(`[ApiClient] ${defaultMessage}`, JSON.stringify({
                name: error.name,
                stack: error.stack,
                payload
            }))
            return payload
        }

        const payload: ActionErrorPayload = { message: defaultMessage }
        // 型不明の値は循環参照でJSON.stringifyが失敗し得るため文字列化して出力する
        console.error(`[ApiClient] ${defaultMessage}`, JSON.stringify({
            error: String(error),
            payload
        }))
        return payload
    }
}

export default ApiClient
