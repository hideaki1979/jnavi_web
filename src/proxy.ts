import { NextRequest, NextResponse } from "next/server";

/**
 * 認証が必要なルートへのリクエスト時に、セッションの有無と有効性を検証し、不正な場合はログインページへリダイレクトします。
 *
 * セッションが存在しない、または認証APIによる検証に失敗した場合、元のリクエストパスを`redirect_to`クエリパラメータとして付与し、ログインページへリダイレクトします。API通信エラー時は追加で`error=auth_failed`も付与されます。
 */
export async function proxy(request: NextRequest) {
    const session = request.cookies.get('session')?.value

    if (!session) {
        const loginUrl = new URL('/auth/login', request.url)
        loginUrl.searchParams.set('redirect_to', request.nextUrl.pathname)
        return NextResponse.redirect(loginUrl)
    }

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
        if (!isAuth) {
            const loginUrl = new URL('/auth/login', request.url);
            loginUrl.searchParams.set('redirect_to', request.nextUrl.pathname)
            return NextResponse.redirect(loginUrl);
        }

        return NextResponse.next()

    } catch (error) {
        console.error('認証APIエラー：', error)
        const loginUrl = new URL('/auth/login', request.url)
        loginUrl.searchParams.set('redirect_to', request.nextUrl.pathname)
        loginUrl.searchParams.set('error', 'auth_failed')
        return NextResponse.redirect(loginUrl)
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