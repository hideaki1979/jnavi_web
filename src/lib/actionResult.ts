import { ActionErrorPayload, ActionResult } from "@/types/actionResult"
import { ApiClientError, ExpressValidationError } from "@/types/validation"

/**
 * Server Action から返されたエラー情報を復元した Error クラス。
 *
 * Server Action 側では throw せずに {@link ActionErrorPayload} を返すため、
 * 呼び出し側（クライアント）でこのクラスに詰め直して例外として扱う。
 * これにより React Query の `onError` / `isError` や `useApiError` など、
 * 既存の「例外前提」のエラーハンドリングをそのまま利用できる。
 *
 * ※ axios に依存しないため、クライアントバンドルに含めても問題ない。
 */
export class ActionError extends Error implements ApiClientError {
    public errors?: ExpressValidationError[]
    public status?: number

    constructor({ message, errors, status }: ActionErrorPayload) {
        super(message)
        this.name = "ActionError"
        this.errors = errors
        this.status = status
    }
}

/**
 * Server Action の戻り値から値を取り出す。
 * - 成功時: `data` をそのまま返す
 * - 失敗時: エラー情報の全量をログに出力したうえで {@link ActionError} を throw する
 *
 * 画面に表示されるのは {@link ActionError} の `message` のみ。
 * ステータスコードやバリデーション詳細を含むJSON全体はログ側で確認する。
 *
 * @param result Server Action の戻り値
 * @returns 成功時のデータ
 * @throws {ActionError} Server Action が失敗を返した場合
 */
export function unwrapActionResult<T>(result: ActionResult<T>): T {
    if (result.success) {
        return result.data
    }

    // サーバー側は ApiClient.toActionError が同じ内容を出力済みのため、ブラウザ側のみ出力する
    if (typeof window !== "undefined") {
        console.error("[ActionError]", JSON.stringify(result.error))
    }

    throw new ActionError(result.error)
}
