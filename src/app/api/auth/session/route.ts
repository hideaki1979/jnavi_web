import * as admin from 'firebase-admin'
import { NextRequest, NextResponse } from 'next/server';
import '@/lib/server/firebaseAdmin'

/**
 * IDトークンからセッションクッキーを生成し、HttpOnlyクッキーとして設定する
 * @param request 
 * @returns 
 */
export async function POST(request: NextRequest) {
    try {
        const idToken = request.headers.get('Authorization')?.split('Bearer ')[1]
        if (!idToken) {
            return NextResponse.json({ error: 'IDトークンは必須です' }, { status: 401 })
        }

        // 5日間有効なセッションクッキーを作成
        const expiresIn = 60 * 60 * 24 * 5 * 1000
        const sessionCookie = await admin.auth().createSessionCookie(idToken, { expiresIn })

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