import { BaseToppingCall, FormattedToppingOptionIds, FormattedToppingOptionNames, SimulationToppingOption } from "./ToppingCall";

// 店舗登録フォーム画面用の型
export interface StoreInput {
    store_name: string;
    branch_name?: string;
    address: string;
    business_hours: string;
    regular_holidays: string;
    prior_meal_voucher: boolean;
    is_all_increased: boolean;
    is_lot: boolean;
    topping_details?: string;
    call_details?: string;
    lot_detail?: string;

    // トッピングとコール情報
    topping_calls: BaseToppingCall[]
}

// マップデータの型定義
// 店舗情報
export interface MapStore {
    id: string | number;
    store_name: string;
    branch_name?: string | null;
    address: string;
    is_close?: boolean;
}

// マップ＋店舗情報（MAP画面用）
export interface MapData {
    id: string | number;
    latitude: number;
    longitude: number;
    store: MapStore;
}

// MAP情報取得APIレスポンスの型は ApiEnvelope<MapData[]>（@/types/api）に統合した。
// 旧 MapApiResponse は `status: string` を宣言していたが、バックエンドが返すのは
// `success: true` であり、実装と一致していなかったため削除している。

// 画像ダウンロード用の画像情報データ型
export interface StoreImageDownloadData {
    id: number | string;
    store_id: number | string;
    user_id: string;
    menu_type: number | string;
    menu_name: string;
    image_url: string;
    topping_calls?: {
        topping_id: number | string;
        topping_name: string;
        call_option_id: number | string;
        call_option_name: string;
    }[];
}

// シミュレーションの券売機
export interface Ticket {
    id: number;
    menu_name: string;
    price: number;
}

// シミュレーション用の店舗データ（食券購入で店舗全件取得：getStoresAll）
export interface SimulationSelectStoresData {
    id: string | number;
    store_name: string;
    branch_name?: string | null;
}

// シミュレーション・画像画面用の店舗データ（事前トッピング／着丼前トッピング：getStoreToppingCalls）
export interface SimulationSelectToppingCallsData {
    store_id: string | number;
    store_name: string;
    branch_name?: string | null;
    formattedToppingOptions?: [number, SimulationToppingOption][];
}

// （店舗詳細画面用）整形済店舗・トッピングコール情報（getStoreById）
export interface FormattedToppingOptionNameStoreData {
    // StoreDataの店舗別トッピングコール情報以外の全プロパティ
    id: number;
    store_name: string;
    branch_name?: string | null;
    address: string;
    business_hours: string;
    regular_holidays: string;
    prior_meal_voucher: boolean;
    topping_details?: string | null;
    call_details?: string | null;
    is_all_increased: boolean;
    is_lot: boolean;
    lot_detail?: string | null;
    is_close?: boolean;

    // （トッピング・オプション）整形済名称リスト
    preCallFormatted: FormattedToppingOptionNames;
    postCallFormatted: FormattedToppingOptionNames;

    // （トッピング・オプション）整形済IDリスト
    preCallFormattedIds: FormattedToppingOptionIds;
    postCallFormattedIds: FormattedToppingOptionIds;
}

export type ResultDialogType = "success" | "error" | "warning"
