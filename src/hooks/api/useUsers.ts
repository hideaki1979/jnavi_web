import { createUser, getUserByUid } from "@/app/api/user"
import { useNotification } from "@/lib/notification"
import { User } from "@/types/user"
import { ApiClientError } from "@/types/validation"
import { useMutation, useQuery } from "@tanstack/react-query"

// クエリキーを一元管理
const userKeys = {
    all: ["users"] as const,
    detail: (uid: string) => [...userKeys.all, uid] as const
}

/**
 * UIDによるユーザー情報を取得する
 * @param uid ユーザーUID
 * @param idToken 認証トークン
 */
export const useUser = (uid: string, idToken: string) => {
    return useQuery({
        queryKey: userKeys.detail(uid),
        queryFn: () => getUserByUid(uid, idToken),
        enabled: !!uid && !!idToken
    })
}

/**
 * ユーザーを新規作成する
 */
export const useCreateUser = () => {
    const { showNotification } = useNotification()

    return useMutation({
        mutationFn: ({ user, idToken }: { user: User, idToken: string }) =>
            createUser(user, idToken),
        onSuccess: () => showNotification("ユーザー登録が完了しました", "success"),
        onError: (error) => {
            console.error("ユーザー登録処理に失敗しました", error)
            const apiError = error as ApiClientError
            showNotification(apiError.message || "ユーザー登録処理に失敗しました", "error")
        }
    })
}
