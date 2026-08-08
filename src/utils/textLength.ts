/**
 * テキストの文字数カウントユーティリティ。
 * - countTextLength: サーバ側と同一基準の文字数カウント
 */

// 異体字セレクタ（U+FE0F: emoji表示 / U+FE0E: text表示）
const VARIATION_SELECTOR_PATTERN = /[\uFE0F\uFE0E]/g
// サロゲートペア（絵文字などBMP外の文字）
const SURROGATE_PAIR_PATTERN = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g

/**
 * サーバ側のバリデーション（validator.js の `isLength`）と同じ基準で文字数を数える。
 *
 * JavaScript の `String.prototype.length` は UTF-16 コードユニット数のため、
 * 絵文字（サロゲートペア）を2文字として数えてしまい、サーバより厳しい判定になる。
 * validator.js はサロゲートペアと異体字セレクタを差し引くため、
 * その挙動に揃えることでフロントとサーバの文字数判定を一致させる。
 *
 * @param value 対象の文字列
 * @returns サーバ基準の文字数
 */
export const countTextLength = (value: string): number => {
    if (!value) return 0

    const variationSelectors = value.match(VARIATION_SELECTOR_PATTERN) ?? []
    const surrogatePairs = value.match(SURROGATE_PAIR_PATTERN) ?? []

    return value.length - variationSelectors.length - surrogatePairs.length
}
