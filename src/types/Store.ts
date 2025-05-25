import { BaseToppingCall } from "./ToppingCall";

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

/**
 * 店舗登録画面の型定義（店舗情報+店舗別トッピングコール情報）
 */
export interface ApiStoreData {
    id: string | number;
    store_name: string;
    branch_name?: string;
    address: string;
    business_hours: string;
    regular_holidays: string;
    prior_meal_voucher: boolean;
    is_all_increased: boolean;
    is_lot: boolean;
    topping_detail?: string;
    call_details?: string;
    lot_details?: string;
    created_at?: string;
    updated_at?: string;
    store_topping_calls?: StoreToppingCall[];
    is_close?: boolean;
}

/**
 * 店舗登録画面APIレスポンスの型定義
 * （サーバから正式に返ってくる値（maps、ステータス、メッセージ））
 */
export interface StoreApiResponse {
    data: {
        store: ApiStoreData;
        map: {
            id: string | number;
            store_id: string | number;
            latitude: string;
            longitude: string;
            created_at: string;
            updated_at: string;
        }
    };
    message: string;
    status: string;
}

// トッピング情報の型定義
export interface StoreToppingCall extends BaseToppingCall {
    store_id: string | number;
    topping: {
        id: string | number;
        topping_category: number;
        topping_name: string;
    };
    call_option: {
        id: string | number;
        call_category: number;
        call_option_name: string;
    };
    noodle_type: {
        id: string | number;
        noodle_type_name: string;
    };
}

// マップデータの型定義
// 店舗情報
export interface MapStore {
    id: string | number;
    store_name: string;
    branch_name?: string | null;
    address: string;
    images?: string[] | null;
    is_close?: boolean;
}

// マップ＋店舗情報（MAP画面用）
export interface MapData {
    id: string | number;
    latitude: number;
    longitude: number;
    store: MapStore;
}

// MAP情報取得APIレスポンスの型定義
export interface MapApiResponse {
    status: string;
    message: string;
    data: MapData[];
}

// 画像ダウンロード用の画像情報データ型
export interface StoreImageDownloadData {
    id: number | string;
    store_id: number | string;
    user_id: number | string;
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
