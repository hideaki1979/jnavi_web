"use client"

import { DEFAULT_REDIRECT_PATH, sanitizeRedirectPath } from "@/utils/redirectPath"
import { useSearchParams } from "next/navigation"
import { useMemo } from "react"

/**
 * proxy（`src/proxy.ts`）が `error` クエリに付与するコードと表示メッセージの対応。
 * 未知のコードは {@link FALLBACK_AUTH_ERROR_MESSAGE} を表示する。
 */
const AUTH_ERROR_MESSAGES: Record<string, string> = {
    // 認証APIの呼び出しに失敗（タイムアウト・ネットワークエラー等）
    auth_failed: '認証の確認に失敗しました。お手数ですが、もう一度ログインしてください。',
    // セッションが無効・期限切れ
    session_expired: 'ログインの有効期限が切れました。もう一度ログインしてください。'
}

const FALLBACK_AUTH_ERROR_MESSAGE = '認証エラーが発生しました。もう一度ログインしてください。'

interface UseAuthRedirectReturn {
    /** ログイン成功後の遷移先（検証済みの自サイト内パス） */
    redirectTo: string
    /** 認証失敗理由の表示メッセージ。`error` クエリが無ければ null */
    authErrorMessage: string | null
    /** `redirect_to` を引き継いだリンクを作るためのクエリ文字列（不要な場合は空文字） */
    redirectQuery: string
}

/**
 * 認証ミドルウェア（proxy）からのリダイレクト情報を読み取るフック。
 * - `redirect_to`：ログイン後に戻る先。オープンリダイレクト対策として検証済みの値を返す
 * - `error`：認証に失敗した理由。ログイン画面での案内表示に使う
 *
 * `useSearchParams()` を使うため、呼び出し側はSuspense境界の内側である必要がある。
 */
export function useAuthRedirect(): UseAuthRedirectReturn {
    const searchParams = useSearchParams()

    const redirectTo = useMemo(
        () => sanitizeRedirectPath(searchParams.get('redirect_to')),
        [searchParams]
    )

    const authErrorMessage = useMemo(() => {
        const errorCode = searchParams.get('error')
        if (!errorCode) return null
        return AUTH_ERROR_MESSAGES[errorCode] ?? FALLBACK_AUTH_ERROR_MESSAGE
    }, [searchParams])

    const redirectQuery = useMemo(
        () => redirectTo === DEFAULT_REDIRECT_PATH
            ? ''
            : `?${new URLSearchParams({ redirect_to: redirectTo }).toString()}`,
        [redirectTo]
    )

    return { redirectTo, authErrorMessage, redirectQuery }
}
