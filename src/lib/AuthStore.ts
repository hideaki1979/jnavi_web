import { onAuthStateChanged, User } from "firebase/auth"
import { create } from "zustand"
import { auth } from "./firebase";

interface AuthStore {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    setUser: (user: User | null) => void;
    setLoading: (loading: boolean) => void;
    initialize: () => void;
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
    initialize: () => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            get().setUser(user)
        })
        // クリーンアップ関数を返す
        return unsubscribe
    }
}))