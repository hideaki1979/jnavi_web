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
import ApiClient, { ApiContractError } from "@/lib/ApiClient";
import type { ActionResult } from "@/types/actionResult";
import type { StoreImageDeleteResult, StoreImageUpdateResult, StoreImageUploadData, StoreImageWriteResult } from "@/types/Image";
import { updateTag } from "next/cache";

const api = ApiClient.getInstance()

/**
 * 店舗画像アップロードAPI通信を行う関数。
 * - uploadStoreImage: 店舗画像のアップロードAPI呼び出し
 * @param storeId 店舗ID
 * @param imageData アップロードする画像データ
 * @param idToken 認証用IDトークン
 * @returns 登録された画像IDとURLを含む処理結果
 */

export const uploadStoreImage = async (
    storeId: string | number,
    imageData: StoreImageUploadData,
    idToken: string
): Promise<ActionResult<StoreImageWriteResult>> => {
    // 成功時と「2xx を受けたが本体が読めなかった」時で同じタグを無効化する。
    // 2箇所に書き下すと片方だけ増減して静かにずれるため、ここでまとめる
    const invalidateCaches = () => {
        updateTag(storeImagesTag(storeId))
    }

    let uploaded: StoreImageWriteResult
    try {
        const res = await api.post<unknown>(`/stores/${storeId}/images`, imageData, {
            headers: {
                'Authorization': `Bearer ${idToken}`
            }
        })
        // 殻が契約どおりかを検証してから成功として扱う。
        // 契約違反なら throw され、下の updateTag には進まず catch 側の失敗結果になる
        uploaded = ApiClient.assertEnvelope<StoreImageWriteResult>(
            res.data,
            `POST /stores/${storeId}/images`
        ).data
    } catch (error) {
        // 2xx を受け取ったうえでの契約違反は、サーバー側の処理自体は成立している
        // 可能性が高い。キャッシュを古いまま残すと画面が実態を映さず、
        // 「失敗した」と受け取った利用者の再送信 → 重複登録に繋がるため、
        // この場合は成功時と同じタグを無効化してから失敗を返す。
        // axios が reject した 4xx / 5xx は書き込みが成立していないので対象外。
        if (error instanceof ApiContractError) {
            invalidateCaches()
        }
        return {
            success: false,
            error: ApiClient.toWriteActionError(
                error,
                "画像アップロード処理でエラーが発生しました。"
            )
        }
    }

    // 画像一覧に新しい画像を即時反映させる。
    // try の外に置くのは、アップロード自体は成功しているのに updateTag の失敗を
    // 「アップロード失敗」として返してしまうと、利用者が再送信して重複登録するため。
    invalidateCaches()
    return { success: true, data: uploaded }
}

/**
 * 店舗画像更新API通信を行う関数。
 * - 画像情報の更新
 * @param storeId 店舗ID
 * @param imageId 画像ID
 * @param imageData 更新する画像データ
 * @param idToken 認証用IDトークン
 * @returns 更新後の画像IDとURL、画像を差し替えたかどうかを含む処理結果
 */

export const updateStoreImage = async (
    storeId: string | number,
    imageId: string | number,
    imageData: StoreImageUploadData,
    idToken: string
): Promise<ActionResult<StoreImageUpdateResult>> => {
    // 個別画像と、それを含む一覧の両方が対象。成功時と契約違反時で同じものを無効化する
    const invalidateCaches = () => {
        updateTag(imageTag(storeId, imageId))
        updateTag(storeImagesTag(storeId))
    }

    let updated: StoreImageUpdateResult
    try {
        const res = await api.put<unknown>(`/stores/${storeId}/images/${imageId}`, imageData, {
            headers: {
                'Authorization': `Bearer ${idToken}`
            }
        })
        // 殻が契約どおりかを検証してから成功として扱う（uploadStoreImage と同様）
        updated = ApiClient.assertEnvelope<StoreImageUpdateResult>(
            res.data,
            `PUT /stores/${storeId}/images/${imageId}`
        ).data
    } catch (error) {
        // 2xx を受け取ったうえでの契約違反は、サーバー側の処理自体は成立している
        // 可能性が高い。キャッシュを古いまま残すと画面が実態を映さず、
        // 「失敗した」と受け取った利用者の再送信 → 重複登録に繋がるため、
        // この場合は成功時と同じタグを無効化してから失敗を返す。
        // axios が reject した 4xx / 5xx は書き込みが成立していないので対象外。
        if (error instanceof ApiContractError) {
            invalidateCaches()
        }
        return {
            success: false,
            error: ApiClient.toWriteActionError(
                error,
                "店舗画像更新処理でエラーが発生しました。"
            )
        }
    }

    // 更新が成功しているのに「更新失敗」と返すと、利用者が同じ操作を繰り返すため try の外に置く。
    invalidateCaches()
    return { success: true, data: updated }
}

/**
 * 店舗画像削除API通信を行う関数。
 * - 画像の削除
 * @param storeId 店舗ID
 * @param imageId 画像ID
 * @param idToken 認証用IDトークン
 * @returns 削除した画像IDと削除結果を含む処理結果
 */

export const deleteStoreImage = async (
    storeId: string | number,
    imageId: string | number,
    idToken: string
): Promise<ActionResult<StoreImageDeleteResult>> => {
    // 削除された画像と、それを含む一覧の両方が対象。成功時と契約違反時で同じものを無効化する
    const invalidateCaches = () => {
        updateTag(imageTag(storeId, imageId))
        updateTag(storeImagesTag(storeId))
    }

    let deleted: StoreImageDeleteResult
    try {
        const res = await api.delete<unknown>(`/stores/${storeId}/images/${imageId}`, {
            headers: {
                'Authorization': `Bearer ${idToken}`
            }
        })
        // 殻が契約どおりかを検証してから成功として扱う（uploadStoreImage と同様）
        deleted = ApiClient.assertEnvelope<StoreImageDeleteResult>(
            res.data,
            `DELETE /stores/${storeId}/images/${imageId}`
        ).data
    } catch (error) {
        // 2xx を受け取ったうえでの契約違反は、サーバー側の処理自体は成立している
        // 可能性が高い。キャッシュを古いまま残すと画面が実態を映さず、
        // 「失敗した」と受け取った利用者の再送信 → 重複登録に繋がるため、
        // この場合は成功時と同じタグを無効化してから失敗を返す。
        // axios が reject した 4xx / 5xx は書き込みが成立していないので対象外。
        if (error instanceof ApiContractError) {
            invalidateCaches()
        }
        return {
            success: false,
            error: ApiClient.toWriteActionError(
                error,
                "画像削除処理でエラーが発生しました。"
            )
        }
    }

    // 削除が成功しているのに「削除失敗」と返すと、利用者が消えたはずの画像へ再操作するため try の外に置く。
    invalidateCaches()
    return { success: true, data: deleted }
}

