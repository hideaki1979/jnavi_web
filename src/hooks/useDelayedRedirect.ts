"use client"

import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

/** 予約された遅延遷移の内容 */
interface PendingRedirect {
    /** 遷移先（自サイト内パス） */
    path: string
    /** 遷移までの待機時間（ms） */
    delayMs: number
    /** 履歴の積み方。省略時は `replace` */
    mode?: 'push' | 'replace'
}

interface UseDelayedRedirectReturn {
    /** 遅延遷移を予約する。予約後に再度呼ぶと、前の予約は解除され新しい予約で置き換わる */
    scheduleRedirect: (redirect: PendingRedirect) => void
    /** 遷移待ちかどうか。待機中のフォーム再送信を止めるのに使う */
    isRedirectScheduled: boolean
}

/**
 * 完了トーストを見せるための待機を挟んでから画面遷移するフック。
 *
 * タイマーは `useEffect` のクリーンアップで解除されるため、待機中に
 * コンポーネントがアンマウントされても遷移は発火しない。
 * ハンドラ内で直接 `setTimeout(() => router.push(...))` すると、
 * 待機中にユーザーが自分で別画面へ移動した際にその操作を上書きしてしまう。
 *
 * なおタイマーIDを `useRef` に持つ実装は、refを読むクロージャをrender中に
 * `handleSubmit()` へ渡す都合で `react-hooks/refs` のlintエラーになるため採らない。
 */
export function useDelayedRedirect(): UseDelayedRedirectReturn {
    const router = useRouter()
    const [pendingRedirect, setPendingRedirect] = useState<PendingRedirect | null>(null)

    useEffect(() => {
        if (!pendingRedirect) return
        const { path, delayMs, mode = 'replace' } = pendingRedirect
        const timer = setTimeout(() => {
            if (mode === 'push') {
                router.push(path)
            } else {
                router.replace(path)
            }
        }, delayMs)
        return () => clearTimeout(timer)
    }, [pendingRedirect, router])

    const scheduleRedirect = useCallback((redirect: PendingRedirect) => {
        setPendingRedirect(redirect)
    }, [])

    return { scheduleRedirect, isRedirectScheduled: pendingRedirect !== null }
}
