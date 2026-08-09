import { NextRequest, NextResponse } from "next/server";

/**
 * ログインページへのリダイレクト応答を組み立てます。
 * 元のパス（クエリ文字列含む）を`redirect_to`に、理由コードを`error`に格納します。
 */
function redirectToLogin(request: NextRequest, errorCode?: 'session_expired' | 'auth_failed') {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirect_to', `${request.nextUrl.pathname}${request.nextUrl.search}`)
    if (errorCode) loginUrl.searchParams.set('error', errorCode)
    return NextResponse.redirect(loginUrl)
}

/**
 * 認証が必要なルートへのリクエスト時に、セッションの有無と有効性を検証し、不正な場合はログインページへリダイレクトします。
 *
 * セッションが存在しない、または認証APIによる検証に失敗した場合、元のリクエストパスを`redirect_to`クエリパラメータとして付与し、ログインページへリダイレクトします。
 * リダイレクト理由は`error`クエリパラメータで伝えます（セッション無効：`session_expired` / API通信エラー：`auth_failed`）。
 * 未ログイン（セッションCookieなし）は想定内のため`error`を付与しません。
 *
 * これらのクエリパラメータは`useAuthRedirect`（src/hooks/useAuthRedirect.ts）で読み取られます。
 */
export async function proxy(request: NextRequest) {
    const session = request.cookies.get('session')?.value

    // 未ログインは想定内なのでerrorは付けず、復帰先だけ渡す
    if (!session) return redirectToLogin(request)

    try {
        // 認証APIを呼び出してセッションを検証
        const responseAPI = await fetch(new URL('/api/auth/verify', request.url), {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${session}`,
            },
            // リダイレクトを追跡しない。追跡すると /api/auth/verify の手前に何らかの
            // リダイレクト（Deployment Protection・WAF・trailingSlash 等）が挟まった際に
            // 着地先の 200 応答を認証成功と誤判定し、fail-open になるため。
            redirect: 'manual',
            signal: AbortSignal.timeout(5000)    // 5秒タイムアウト
        });

        // ステータスに加えて本文の isAuth まで検証する。
        // JSONパースに失敗した場合（想定外の応答者）は認証失敗として扱う。
        const isAuth = responseAPI.status === 200 &&
            await responseAPI.json().then(data => data?.isAuth === true).catch(() => false)

        // 認証されていない場合はログインページへリダイレクト
        if (!isAuth) return redirectToLogin(request, 'session_expired')

        return NextResponse.next()

    } catch (error) {
        console.error('認証APIエラー：', error)
        return redirectToLogin(request, 'auth_failed')
    }

}

// 認証が必要なルートを指定
export const config = {
    matcher: [
        '/stores/create',
        '/stores/:id/edit',
        '/stores/images/:id/upload',
        '/stores/images/:id/edit/:path*'
        // 将来的なアカウントページなど（例：'/account/:path*'）
    ]
}