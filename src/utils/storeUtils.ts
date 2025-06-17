import { MENU_TYPE_LABELS } from "@/constants/ui";
import { MapStore, StoreImageDownloadData } from "@/types/Store";

export const getDisplayStoreName = (s: MapStore | null): string => {
    if (!s) return ''
    return s.branch_name ? `${s.store_name} ${s.branch_name}` : s.store_name
}

export const getDisplayMenuName = (i: StoreImageDownloadData | null): string => {
    return i ? `【${MENU_TYPE_LABELS[i.menu_type]}】 ${i.menu_name}`
        : '不明画像';
}