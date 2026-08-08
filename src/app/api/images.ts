/**
 * 店舗画像関連のAPI通信を行う関数群。
 *
 * いずれの関数もエラー時に例外を throw せず、`ActionResult` として結果を返す。
 * Server Action 内で throw された例外は本番ビルドで Next.js にサニタイズされ、
 * APIが返したエラーメッセージ・バリデーション詳細がクライアントへ届かないため。
 * 受け取り側は `unwrapActionResult()` で値の取り出し／例外化を行う。
 */
"use server"

import ApiClient from "@/lib/ApiClient";
import type { ActionResult } from "@/types/actionResult";
import type { StoreImageEditData, StoreImageUploadData } from "@/types/Image";

const api = ApiClient.getInstance()

/**
 * 店舗画像アップロードAPI通信を行う関数。
 * - uploadStoreImage: 店舗画像のアップロードAPI呼び出し
 * @param storeId 店舗ID
 * @param imageData アップロードする画像データ
 * @param idToken 認証用IDトークン
 * @returns APIレスポンスを含む処理結果
 */

export const uploadStoreImage = async (storeId: string | number, imageData: StoreImageUploadData, idToken: string) => {
    try {
        const res = await api.post(`/stores/${storeId}/images`, imageData, {
            headers: {
                'Authorization': `Bearer ${idToken}`
            }
        })
        return { success: true as const, data: res.data }
    } catch (error) {
        return {
            success: false as const,
            error: ApiClient.toActionError(
                error,
                "画像アップロード処理でエラーが発生しました。"
            )
        }
    }
}

/**
 * 店舗画像更新API通信を行う関数。
 * - 画像情報の更新
 * @param storeId 店舗ID
 * @param imageId 画像ID
 * @param imageData 更新する画像データ
 * @param idToken 認証用IDトークン
 * @returns APIレスポンスを含む処理結果
 */

export const updateStoreImage = async (storeId: string | number, imageId: string | number, imageData: StoreImageUploadData, idToken: string) => {
    try {
        const res = await api.put(`/stores/${storeId}/images/${imageId}`, imageData, {
            headers: {
                'Authorization': `Bearer ${idToken}`
            }
        })
        return { success: true as const, data: res.data }
    } catch (error) {
        return {
            success: false as const,
            error: ApiClient.toActionError(
                error,
                "店舗画像更新処理でエラーが発生しました。"
            )
        }
    }
}

/**
 * 店舗画像削除API通信を行う関数。
 * - 画像の削除
 * @param storeId 店舗ID
 * @param imageId 画像ID
 * @param idToken 認証用IDトークン
 * @returns APIレスポンスを含む処理結果
 */

export const deleteStoreImage = async (storeId: string | number, imageId: string | number, idToken: string) => {
    try {
        const res = await api.delete(`/stores/${storeId}/images/${imageId}`, {
            headers: {
                'Authorization': `Bearer ${idToken}`
            }
        })
        return { success: true as const, data: res.data }
    } catch (error) {
        return {
            success: false as const,
            error: ApiClient.toActionError(
                error,
                "画像削除処理でエラーが発生しました。"
            )
        }
    }
}

/**
 * 店舗IDと画像IDを指定して画像情報を取得するAPI通信を行う関数。
 * - 画像情報取得APIにGETリクエストを送信
 * - 成功時にはAPIレスポンスの画像情報を返す
 * - エラー時にはエラー情報を持つ失敗結果を返す
 * @param storeId 店舗ID
 * @param imageId 画像ID
 * @returns 画像情報を含む処理結果
 */

export const getImageById = async (storeId: string | number, imageId: string | number): Promise<ActionResult<StoreImageEditData>> => {
    try {
        const res = await api.get(`/stores/${storeId}/images/${imageId}`)
        return { success: true, data: res.data.data }
    } catch (error) {
        return {
            success: false,
            error: ApiClient.toActionError(
                error,
                "画像取得（１件取得）処理でエラーが発生しました。"
            )
        }
    }
}
