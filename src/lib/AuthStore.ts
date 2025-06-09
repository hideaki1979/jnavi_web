import { onAuthStateChanged, User } from "firebase/auth"
import { create } from "zustand"
import { auth } from "./firebase";

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