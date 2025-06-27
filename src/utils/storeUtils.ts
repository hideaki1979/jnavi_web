import { MENU_TYPE_LABELS } from "@/constants/ui";
import { MapStore, StoreImageDownloadData } from "@/types/Store";

/**
 * MapStore | nullを受け取り、店名を表示用の形式に整形して返す。
 * branch_nameがあれば、store_name + branch_nameを返す。
 * branch_nameが無ければ、store_nameを返す。
 * MapStore | nullがnullの場合、何も返さない。
 */
export const getDisplayStoreName = (s: MapStore | null): string => {
    if (!s) return ''
    return s.branch_name ? `${s.store_name} ${s.branch_name}` : s.store_name
}

/**
 * StoreImageDownloadData | nullを受け取り、メニュー名を表示用の形式に整形して返す。
 * StoreImageDownloadDataがあれば、menu_type(1:通常、2:限定)に応じて
 * 【通常】や【限定】という文字列を先頭につけ、menu_nameを返す。
 * StoreImageDownloadDataがnullの場合、「不明画像」という文字列を返す。
 */
export const getDisplayMenuName = (i: StoreImageDownloadData | null): string => {
    return i ? `【${MENU_TYPE_LABELS[i.menu_type]}】 ${i.menu_name}`
        : '不明画像';
}