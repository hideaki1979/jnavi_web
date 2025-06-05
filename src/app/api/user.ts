"use server"

import ApiClient from "@/lib/ApiClient";
import { User } from "@/types/user";

const api = ApiClient.getInstance()

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