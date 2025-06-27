import { MENU_TYPE_LABELS } from "@/constants/ui";
import { MapStore, StoreImageDownloadData } from "@/types/Store";

/**
 * 表示用の店舗名文字列を生成します。
 *
 * - `branch_name` が存在する場合: `店舗名 支店名`
 * - `branch_name` が存在しない場合: `店舗名`
 * - `s` が `null` の場合: 空文字列
 *
 * @param {MapStore | null} s - 店舗情報オブジェクトまたは `null`。
 * @returns {string} 整形された店舗名。
 */
export const getDisplayStoreName = (s: MapStore | null): string => {
    if (!s) return ''
    return s.branch_name ? `${s.store_name} ${s.branch_name}` : s.store_name
}

/**
 * 表示用のメニュー名文字列を生成します。
 *
 * - `i` データが存在する場合: `【メニュータイプ】 メニュー名`
 *   - `menu_type` (1:通常, 2:限定) に応じてプレフィックスが付きます。
 * - `i` データが `null` の場合: `"不明画像"`
 *
 * @param {StoreImageDownloadData | null} i - 画像情報オブジェクトまたは `null`。
 * @returns {string} 整形されたメニュー名。
 */
export const getDisplayMenuName = (i: StoreImageDownloadData | null): string => {
    return i ? `【${MENU_TYPE_LABELS[i.menu_type]}】 ${i.menu_name}`
        : '不明画像';
}