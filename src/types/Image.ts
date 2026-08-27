// 画像情報アップロード用のデータ型
export interface StoreImageUploadData {
    store_id: number | string;
    user_id: string;
    menu_type: number;
    menu_name: string;
    image_base64?: string | null;
    topping_selections?: {
        topping_id: number | string;
        call_option_id: number | string;
        store_topping_call_id?: number | string;
    }[]
}

// 店舗別画像更新画面用のインターフェース
export interface StoreImageEditData {
    id: number | string;
    store_id: number | string;
    user_id: string;
    menu_type: number | string;
    menu_name: string;
    image_url: string;
    topping_selections: {
        topping_id: number | string;
        call_option_id: number | string;
        store_topping_call_id: number | string;
    }[];
}

/**
 * 画像アップロードAPI（`POST /stores/:storeId/images`）の`data`部。
 *
 * `imageId`が number ではなく string なのは、DB上が BigInt のため
 * バックエンドが`toString()`して返しているから（JSONでは数値として表現できない）。
 */
export interface StoreImageWriteResult {
    /** 登録された画像ID（BigIntのため文字列で返る） */
    imageId: string;
    /** アップロードした画像の公開URL */
    imageUrl: string;
}

/**
 * 画像更新API（`PUT /stores/:storeId/images/:imageId`）の`data`部。
 *
 * 更新は画像ファイルの差し替えを伴わない場合があるため、
 * アップロード時の`data`に`imageUpdated`が1つ増えた形になっている。
 */
export interface StoreImageUpdateResult extends StoreImageWriteResult {
    /**
     * 画像ファイル自体を差し替えたかどうか。
     * リクエストに`image_base64`を指定した場合のみ true になり、
     * false のとき`imageUrl`は更新前のURLがそのまま返る。
     */
    imageUpdated: boolean;
}

/**
 * 画像削除API（`DELETE /stores/:storeId/images/:imageId`）の`data`部。
 */
export interface StoreImageDeleteResult {
    /** 削除した画像ID（BigIntのため文字列で返る） */
    imageId: string;
    /** 削除に成功したかどうか。バックエンドは成功時のみ true を返す */
    deleted: boolean;
}
