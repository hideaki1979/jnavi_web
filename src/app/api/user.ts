"use server"

import ApiClient from "@/lib/ApiClient";
import { User } from "@/types/user";

const api = ApiClient.getInstance()

/**
 * ユーザー情報の作成・取得API通信を行う関数群。
 * - createUser: ユーザー新規登録API呼び出し
 * - getUserByUid: UIDによるユーザー情報取得API呼び出し
 */

export const createUser = async (user: User, idToken: string): Promise<void> => {
    try {
        const res = await api.post('/users', user, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`
            }
        })
        return res.data
    } catch (error) {
        throw ApiClient.handlerError(
            error,
            "ユーザー情報登録時にエラーが発生しました。"
        )
    }
}

/**
 * UIDによるユーザー情報取得API呼び出しを行う関数。
 * @param uid ユーザーのUID
 * @param idToken 認証トークン
 * @returns ユーザー情報が取得できた場合はUserオブジェクト、取得できなかった場合はnull
 */
export const getUserByUid = async (uid: string, idToken: string): Promise<User | null> => {
    try {
        const res = await api.get(`/users/${uid}`, {
            headers: {
                'Authorization': `Bearer ${idToken}`
            }
        })
        return res.data
    } catch (error) {
        ApiClient.handlerError(
            error,
            'ユーザー情報取得中に予期せぬエラーが発生しました'
        )
        return null
    }
}