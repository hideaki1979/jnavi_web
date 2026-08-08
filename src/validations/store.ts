import { countTextLength } from "@/utils/textLength";
import { z } from "zod";

/**
 * 店舗情報フォームのバリデーションスキーマ定義。
 * - StoreInputSchema: 店舗入力フォームのバリデーション
 *
 * サーバ側（express-validator）と同じ基準で検証することで、
 * 無駄なリクエスト往復と 400 エラーを防ぐ。
 * - 必須項目: trim 後に空判定（空白のみの入力を弾く）
 * - 全テキスト項目: trim 後の文字数で上限判定
 */

// 文字数上限（サーバ側の validation.ts と揃えること）
// 255: DB が VarChar(255) のカラム / 1000: DB は Text 型だがアプリ側で定めた上限
export const STORE_TEXT_MAX_LENGTH = 255
export const STORE_DETAIL_MAX_LENGTH = 1000

/**
 * サーバと同一基準の文字数上限チェックを付与する
 * @param schema 対象のスキーマ
 * @param max 文字数上限
 * @param label エラーメッセージに表示する項目名
 */
const withMaxLength = (schema: z.ZodString, max: number, label: string) =>
    schema.refine(
        (value) => countTextLength(value) <= max,
        { message: `${label}は${max}文字以内で入力してください` }
    )

/**
 * 必須テキスト項目のスキーマを生成する
 * `trim()` の後に `min(1)` を置くことで、空白のみの入力を弾く
 */
const requiredText = (label: string, max: number = STORE_TEXT_MAX_LENGTH) =>
    withMaxLength(z.string().trim().min(1, `${label}は必須です`), max, label)

/**
 * 任意テキスト項目のスキーマを生成する
 * 空文字は「入力なし」として許容するため、空判定は行わない
 */
const optionalText = (label: string, max: number) =>
    withMaxLength(z.string().trim(), max, label).optional()

export const StoreInputSchema = z.object({
    store_name: requiredText("店舗名"),
    branch_name: optionalText("支店名", STORE_TEXT_MAX_LENGTH),
    address: requiredText("住所"),
    business_hours: requiredText("営業時間"),
    regular_holidays: requiredText("定休日"),
    prior_meal_voucher: z.boolean(),
    is_all_increased: z.boolean(),
    is_lot: z.boolean(),
    topping_details: optionalText("トッピング補足情報", STORE_DETAIL_MAX_LENGTH),
    call_details: optionalText("コール補足情報", STORE_DETAIL_MAX_LENGTH),
    lot_detail: optionalText("ロット補足情報", STORE_DETAIL_MAX_LENGTH)
})

export type StoreFormInput = z.infer<typeof StoreInputSchema>
