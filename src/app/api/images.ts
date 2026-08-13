/**
 * 店舗画像関連の Server Action。
 * - 画像のアップロード・更新・削除（書き込み）のみを扱う
 * - 読み取りは images.queries.ts の`"use cache"`付き関数を直接 import する
 *   （サーバーコンポーネント専用。クライアント向けラッパは未使用のため #94 で削除した）
 *
 * 分離の意図と全体構成は stores.ts / stores.queries.ts のコメントを参照。
 * 書き込み後は`updateTag`で該当タグを無効化し、自アプリからの更新を即時反映させる。
 *
 * いずれの関数もエラー時に例外を throw せず、`ActionResult` として結果を返す。
 * Server Action 内で throw された例外は本番ビルドで Next.js にサニタイズされ、
 * APIが返したエラーメッセージ・バリデーション詳細がクライアントへ届かないため。
 * 受け取り側は `unwrapActionResult()` で値の取り出し／例外化を行う。
 */
"use server"

import { imageTag, storeImagesTag } from "@/app/api/stores.queries";
import ApiClient from "@/lib/ApiClient";
import type { StoreImageUploadData } from "@/types/Image";
import type { AxiosResponse } from "axios";
import { updateTag } from "next/cache";

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
    let res: AxiosResponse
    try {
        res = await api.post(`/stores/${storeId}/images`, imageData, {
            headers: {
                'Authorization': `Bearer ${idToken}`
            }
        })
    } catch (error) {
        return {
            success: false as const,
            error: ApiClient.toActionError(
                error,
                "画像アップロード処理でエラーが発生しました。"
            )
        }
    }

    // 画像一覧に新しい画像を即時反映させる。
    // try の外に置くのは、アップロード自体は成功しているのに updateTag の失敗を
    // 「アップロード失敗」として返してしまうと、利用者が再送信して重複登録するため。
    updateTag(storeImagesTag(storeId))
    return { success: true as const, data: res.data }
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
    let res: AxiosResponse
    try {
        res = await api.put(`/stores/${storeId}/images/${imageId}`, imageData, {
            headers: {
                'Authorization': `Bearer ${idToken}`
            }
        })
    } catch (error) {
        return {
            success: false as const,
            error: ApiClient.toActionError(
                error,
                "店舗画像更新処理でエラーが発生しました。"
            )
        }
    }

    // 個別画像と、それを含む一覧の両方を無効化する。
    // 更新が成功しているのに「更新失敗」と返すと、利用者が同じ操作を繰り返すため try の外に置く。
    updateTag(imageTag(storeId, imageId))
    updateTag(storeImagesTag(storeId))
    return { success: true as const, data: res.data }
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
    let res: AxiosResponse
    try {
        res = await api.delete(`/stores/${storeId}/images/${imageId}`, {
            headers: {
                'Authorization': `Bearer ${idToken}`
            }
        })
    } catch (error) {
        return {
            success: false as const,
            error: ApiClient.toActionError(
                error,
                "画像削除処理でエラーが発生しました。"
            )
        }
    }

    // 削除された画像と、それを含む一覧の両方を無効化する。
    // 削除が成功しているのに「削除失敗」と返すと、利用者が消えたはずの画像へ再操作するため try の外に置く。
    updateTag(imageTag(storeId, imageId))
    updateTag(storeImagesTag(storeId))
    return { success: true as const, data: res.data }
}

