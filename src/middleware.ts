import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "./lib/server/auth";

export const runtime = 'nodejs'

// この関数は、リクエストがmatcheに指定されたパスと一致する場合に呼び出されます。
export async function middleware(request: NextRequest) {
    const user = await verifySession(request)

    if (!user) {
        // ユーザーが認証されていない場合、ログインページにリダイレクトします。
        // request.urlを使用して、リダイレクト後のログイン成功時に
        // 元のページに戻れるよう、リダイレクトURLをクエリパラメータとして追加します。
        const loginUrl = new URL(`/auth/login`, request.url)
        loginUrl.searchParams.set('redirect_to', request.nextUrl.pathname)
        return NextResponse.redirect(loginUrl)
    }

    // ユーザーが認証されている場合、リクエストを続行します。
    return NextResponse.next()

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