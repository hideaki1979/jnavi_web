import ApiClient from "@/lib/ApiClient";
import { User } from "@/types/user";
import { getAuth } from "firebase/auth";

const api = ApiClient.getInstance()
const auth = getAuth()

export const createUser = async (user: User): Promise<void> => {
    try {
        // Firebase認証トークンの取得
        const idToken = await auth.currentUser?.getIdToken()
        if (!idToken) {
            throw new Error('認証トークンの取得に失敗しました。')
        }

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