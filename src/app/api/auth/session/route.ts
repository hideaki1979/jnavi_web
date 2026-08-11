import { getAuth } from 'firebase-admin/auth'
import { NextRequest, NextResponse } from 'next/server';
import '@/lib/server/firebaseAdmin'

// 直近のサインインとみなす猶予（秒）。Firebase公式の推奨値。
const RECENT_SIGN_IN_WINDOW_SEC = 5 * 60

/**
 * IDトークンからセッションクッキーを生成し、HttpOnlyクッキーとして設定する
 * @param request
 * @returns
 */
export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('Authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Authorization headerが必要です' }, { status: 401 })
        }

        const idToken = authHeader.substring(7) // 'Bearer '.length = 7
        if (!idToken) {
            return NextResponse.json({ error: 'IDトークンは必須です' }, { status: 401 })
        }

        // IDトークン（有効期限1時間）の盗用対策。
        // 検証せずにセッションクッキーを発行すると、盗まれたIDトークンを
        // 5日間有効なクッキーへ引き換えられてしまうため、
        // 直近5分以内にサインインしたトークンのみを受け付ける。
        const decodedIdToken = await getAuth().verifyIdToken(idToken)
        if (Date.now() / 1000 - decodedIdToken.auth_time >= RECENT_SIGN_IN_WINDOW_SEC) {
            return NextResponse.json(
                { error: '再ログインが必要です', code: 'recent_sign_in_required' },
                { status: 401 }
            )
        }

        // 5日間有効なセッションクッキーを作成
        const expiresIn = 60 * 60 * 24 * 5 * 1000
        const sessionCookie = await getAuth().createSessionCookie(idToken, { expiresIn })

        const options = {
            name: 'session',
            value: sessionCookie,
            maxAge: expiresIn / 1000, // maxAgeは秒単位
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            sameSite: 'lax' as const
        }

        const response = NextResponse.json({ status: 'success' }, { status: 200 })
        response.cookies.set(options)
        return response
    } catch (error) {
        console.error('Session creation error:', error);
        return NextResponse.json({ error: 'Failed to create session' }, { status: 401 });
    }
}