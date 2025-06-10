"use client"

import { useAuthStore } from "@/lib/AuthStore"
import { useEffect } from "react"

/**
 * Firebase認証状態の初期化・監視を行うProviderコンポーネント。
 * - useAuthStoreのinitializeを呼び出し、認証状態をグローバル管理
 */

interface AuthProviderProps {
    children: React.ReactNode
}

/**
 * Firebase Authenticationの認証状態（ユーザー情報・認証済みか・ローディング状態）をZustandでグローバル管理するProviderコンポーネント。
 * - useAuthStoreのinitializeを呼び出し、認証状態をグローバル管理
 * @param children AuthProviderで囲むコンポーネントツリー
 * @returns AuthProviderコンポーネント
 */
export function AuthProvider({ children }: AuthProviderProps) {
    const initialize = useAuthStore((state) => state.initialize)
    useEffect(() => {
        const unsubscribe = initialize()
        return unsubscribe
    }, [initialize])

    return <>{children}</>
}