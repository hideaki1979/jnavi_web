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
    isInitialized: boolean;
    initialize: () => (() => void);
}

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
    isInitialized: false,
    initialize: () => {
        if (get().isInitialized) {
            console.warn("AuthStore is already initialized")
            return () => { }
        }
        set({ isInitialized: true })
        const unsubscribe = onAuthStateChanged(auth, (user) => {
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
        // クリーンアップ関数を返す
        return unsubscribe
    }
}))