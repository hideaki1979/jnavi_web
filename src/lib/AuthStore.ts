import { onAuthStateChanged, User } from "firebase/auth"
import { create } from "zustand"
import { auth } from "./firebase";

/**
 * Firebase Authenticationの認証状態（ユーザー情報・認証済みか・ローディング状態）をZustandでグローバル管理するストア。
 * - user: FirebaseのUserオブジェクト
 * - isAuthenticated: 認証済みかどうか
 * - isLoading: ローディング中かどうか
 * - initialize: FirebaseのonAuthStateChangedで認証状態を監視し、状態を更新
 */

interface AuthStore {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    setUser: (user: User | null) => void;
    setLoading: (loading: boolean) => void;
    initialize: () => (() => void);
}

/**
 * onAuthStateChangedの購読は購読者数で管理する。
 * 「初期化済みフラグ」で二重購読を防ぐ実装だと、React Strict Mode（`next dev`）の
 * マウント→クリーンアップ→再マウントでフラグだけが残り、再購読されずに
 * isLoadingがtrueのまま固定されてしまうため。
 */
let authUnsubscribe: (() => void) | null = null
let subscriberCount = 0

export const useAuthStore = create<AuthStore>((set, get) => ({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    setUser: (user: User | null) => {
        set({ user, isAuthenticated: !!user, isLoading: false })
    },
    setLoading: (loading: boolean) => {
        set({ isLoading: loading })
    },
    initialize: () => {
        subscriberCount += 1
        // 購読者が居ない状態からの初回のみ購読する（複数箇所から呼ばれてもリスナーは1つ）
        if (!authUnsubscribe) {
            authUnsubscribe = onAuthStateChanged(auth, (user) => {
                try {
                    get().setUser(user)
                } catch (error) {
                    console.error("Error Updating AuthStore", error)
                    get().setLoading(false)
                }
            }, (error) => {
                console.error("Error Change AuthStore", error)
                get().setLoading(false)
            })
        }

        // クリーンアップ関数を返す。購読者が居なくなったときだけ購読を解除する
        let released = false
        return () => {
            if (released) return
            released = true
            subscriberCount -= 1
            if (subscriberCount <= 0) {
                subscriberCount = 0
                authUnsubscribe?.()
                authUnsubscribe = null
                // ここで user / isAuthenticated / isLoading をリセットしないのは意図的。
                // 真実の情報源は auth.currentUser 側にあり、再購読時に Firebase が
                // 同じ値を配り直すため、残っている値は「古い」のではなく「正しい」。
                // 逆に isLoading を true に戻すと、リスナーが解除済みで false に戻す者が
                // 居ないため、購読者が残っている場合にローディング表示で固定される（#74 の再発）。
            }
        }
    }
}))
