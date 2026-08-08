import { ExpressValidationError } from "./validation"

/**
 * Server Action が失敗した際に返すエラー情報。
 *
 * Server Action 内で throw されたエラーは、本番ビルドでは Next.js によって
 * メッセージがサニタイズされる（汎用文言 + digest に置換される）ため、
 * APIから受け取ったエラー内容をクライアントへ届けるには
 * 「例外」ではなく「シリアライズ可能な戻り値」として返す必要がある。
 */
export interface ActionErrorPayload {
    /** 画面に表示するエラーメッセージ */
    message: string;
    /** express-validator のバリデーションエラー詳細 */
    errors?: ExpressValidationError[];
    /** APIレスポンスのHTTPステータスコード（取得できた場合のみ） */
    status?: number;
}

/**
 * Server Action の戻り値を表す判別可能なユニオン型。
 * - 成功時: `{ success: true, data: T }`
 * - 失敗時: `{ success: false, error: ActionErrorPayload }`
 *
 * 受け取り側は {@link unwrapActionResult} で値の取り出し／例外化を行う。
 */
export type ActionResult<T> =
    | { success: true; data: T }
    | { success: false; error: ActionErrorPayload }
