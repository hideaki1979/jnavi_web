/**
 * ユーザー情報の作成・取得API通信を行う関数群。
 * - createUser: ユーザー新規登録API呼び出し
 * - getUserByUid: UIDによるユーザー情報取得API呼び出し
 *
 * いずれの関数もエラー時に例外を throw せず、`ActionResult` として結果を返す。
 * Server Action 内で throw された例外は本番ビルドで Next.js にサニタイズされ、
 * APIが返したエラーメッセージ・バリデーション詳細がクライアントへ届かないため。
 * 受け取り側は `unwrapActionResult()` で値の取り出し／例外化を行う。
 */
"use server"

import ApiClient from "@/lib/ApiClient";
import type { ActionResult } from "@/types/actionResult";
import type { ApiUser, CreateUserInput } from "@/types/user";

const api = ApiClient.getInstance()

/**
 * ユーザー新規登録API呼び出しを行う関数。
 *
 * `uid`は受け取らない。バックエンドが検証済みトークンから取り直すため、
 * リクエストボディに入れても無視される（{@link CreateUserInput} 参照）。
 *
 * @param user 登録するユーザー情報。値が無い項目は null ではなくキーごと省略すること
 * @param idToken 認証トークン
 * @returns 登録処理の結果
 */
export const createUser = async (user: CreateUserInput, idToken: string): Promise<ActionResult<void>> => {
    try {
        // 登録されたユーザー行（`data`）も message も使わないが、殻の検証は通す。
        // 検証を省くと「2xx なのに契約と違うボディ」が登録成功として扱われるため、
        // 戻り値を使わなくても呼び出す（契約違反なら throw されて catch に落ちる）。
        const res = await api.post<unknown>('/users', user, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`
            }
        })
        ApiClient.assertMessageEnvelope(res.data, "POST /users")
        return { success: true, data: undefined }
    } catch (error) {
        return {
            success: false,
            // 2xx を受けたうえでの契約違反は登録が成立している可能性が高い。
            // 再送信させるとメール重複で 500 になり、原因が分からない失敗に化けるため、
            // 「確認してほしい」と伝わる文言に寄せる（無効化すべきキャッシュは無い）。
            error: ApiClient.toWriteActionError(
                error,
                "ユーザー情報登録時にエラーが発生しました。"
            )
        }
    }
}

/**
 * UIDによるユーザー情報取得API呼び出しを行う関数。
 *
 * 戻り値がリクエスト用の`User`ではなく`ApiUser`なのは、バックエンドが
 * Prismaの行をそのまま返しており、キー名がスネークケースで別物のため
 * （`uid`→`id`、`displayName`→`display_name`、`authProvider`→`provider`）。
 *
 * 成功時に`null`は返らない。該当ユーザーが存在しない場合バックエンドは404を返し、
 * axios が reject するため catch 側の失敗結果に倒れる。
 *
 * @param uid ユーザーのUID
 * @param idToken 認証トークン
 * @returns ユーザー情報を含む処理結果
 */
export const getUserByUid = async (uid: string, idToken: string): Promise<ActionResult<ApiUser>> => {
    try {
        const res = await api.get<unknown>(`/users/${uid}`, {
            headers: {
                'Authorization': `Bearer ${idToken}`
            }
        })
        // エンベロープの殻を検証してから本体を返す（他の読み取り関数と同じ扱い）。
        // 以前は`res.data`とエンベロープを丸ごと返しており、
        // `res.data`が any だったため型注釈との食い違いが検出されていなかった。
        const envelope = ApiClient.assertEnvelope<ApiUser>(res.data, `GET /users/${uid}`)
        return { success: true, data: envelope.data }
    } catch (error) {
        return {
            success: false,
            error: ApiClient.toActionError(
                error,
                'ユーザー情報取得中に予期せぬエラーが発生しました'
            )
        }
    }
}
