import { NextRequest, NextResponse } from "next/server";

export const runtime = 'experimental-edge'

// この関数は、リクエストがmatchesに指定されたパスと一致する場合に呼び出されます。
export async function middleware(request: NextRequest) {
    const session = request.cookies.get('session')?.value

    if (!session) {
        const loginUrl = new URL('/auth/login', request.url)
        loginUrl.searchParams.set('redirect_to', request.nextUrl.pathname)
        return NextResponse.redirect(loginUrl)
    }

    try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)    // 5秒タイムアウト
        // 認証APIを呼び出してセッションを検証
        const responseAPI = await fetch(new URL('/api/auth/verify', request.url), {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${session}`,
            },
            signal: controller.signal
        });

        clearTimeout(timeoutId)

        // 認証されていない場合はログインページへリダイレクト
        if (responseAPI.status !== 200) {
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