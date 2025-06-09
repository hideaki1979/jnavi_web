"use client"

import { useAuthStore } from "@/lib/AuthStore"
import { useEffect } from "react"

interface AuthProviderProps {
    children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
    const initialize = useAuthStore((state) => state.initialize)
    useEffect(() => {
        const unsubscribe = initialize()
        return unsubscribe
    }, [initialize])

    return <>{children}</>
}