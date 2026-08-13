import { ApiEnvelope } from "./api";
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

/**
 * 閉店処理（PATCH /stores/:id/close）が返す店舗情報。
 *
 * バックエンドは `prisma.store.update()` の戻り値を select なしでそのまま返すため、
 * 中身は stores テーブルの全スカラーカラムになる（リレーションは含まれない）。
 * `id` は BigInt だが `BigInt.prototype.toJSON` の拡張によりJSON上は文字列で届く。
 */
export interface ClosedStoreData {
    id: string;
    /** 閉店処理により「【閉店】」が前置された店舗名 */
    store_name: string;
    branch_name: string | null;
    address: string;
    business_hours: string;
    regular_holidays: string;
    prior_meal_voucher: boolean;
    topping_details: string | null;
    call_details: string | null;
    is_all_increased: boolean;
    is_lot: boolean;
    lot_detail: string | null;
    /** 閉店処理後は常に true */
    is_close: boolean;
    created_at: string;
    updated_at: string;
}

/**
 * 閉店処理APIレスポンス情報。
 *
 * 旧定義は `{ data: boolean; status: string; message: string }` だったが、
 * 実際のレスポンスは `status` を持たず、`data` も boolean ではなく
 * 閉店後の店舗行そのものだったため、確認した形状に合わせて再定義している。
 * （Issue #86 が想定した `ApiEnvelope<boolean>` への置き換えは成立しない）
 */
export type StoreCloseApiRes = ApiEnvelope<ClosedStoreData>

export type ResultDialogType = "success" | "error" | "warning"