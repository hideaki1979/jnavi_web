import { getAuth } from 'firebase-admin/auth'
import { NextRequest, NextResponse } from 'next/server';
import '@/lib/server/firebaseAdmin'

// 直近のサインインとみなす猶予（秒）。Firebase公式の推奨値。
const RECENT_SIGN_IN_WINDOW_SEC = 5 * 60

const SESSION_COOKIE_NAME = 'session'

// セッションクッキーの有効期限（ミリ秒）。Firebaseが許容する最大値は14日。
const SESSION_EXPIRES_IN_MS = 60 * 60 * 24 * 5 * 1000

/**
 * セッションクッキーの属性を組み立てる。
 *
 * 発行（POST）と削除（DELETE）で name / path / secure / sameSite が1つでも食い違うと、
 * ブラウザは別のクッキーとみなして削除が効かない。属性はここに一元化して必ず一致させる。
 *
 * @param value クッキー値。削除時は空文字を渡す
 * @param maxAgeSec 有効期間（秒）。0を渡すと即時失効＝削除
 */
function buildSessionCookie(value: string, maxAgeSec: number) {
    return {
        name: SESSION_COOKIE_NAME,
        value,
        maxAge: maxAgeSec,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        sameSite: 'lax' as const
    }
}

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
        const sessionCookie = await getAuth().createSessionCookie(idToken, { expiresIn: SESSION_EXPIRES_IN_MS })

        const response = NextResponse.json({ status: 'success' }, { status: 200 })
        response.cookies.set(buildSessionCookie(sessionCookie, SESSION_EXPIRES_IN_MS / 1000)) // maxAgeは秒単位
        return response
    } catch (error) {
        console.error('Session creation error:', error);
        return NextResponse.json({ error: 'Failed to create session' }, { status: 401 });
    }
}

/**
 * 「クッキーがすでに無効で、失効させる対象が存在しない」ことを示すFirebaseのエラーコード。
 * これらは失効処理が不要なだけなので、ログアウトとしては成功として扱う。
 *
 * 逆に`auth/internal-error`・`auth/quota-exceeded`やネットワークエラーなど、
 * ここに載っていないものは「失効できたか分からない」失敗として扱う。
 */
const ALREADY_INVALID_ERROR_CODES = new Set([
    'auth/session-cookie-expired',  // 有効期限切れ
    'auth/session-cookie-revoked',  // 失効済み
    'auth/argument-error',          // 形式不正・署名不正・kid不一致（＝検証を通らないクッキー）
    'auth/user-not-found'           // ユーザーが削除済み（revokeRefreshTokens）
])

/** FirebaseError（`code`を持つ）からエラーコードを取り出す。持たない場合はnull */
function getFirebaseErrorCode(error: unknown): string | null {
    if (typeof error !== 'object' || error === null || !('code' in error)) return null
    const { code } = error as { code: unknown }
    return typeof code === 'string' ? code : null
}

/**
 * ログアウト時にセッションクッキーを破棄する。
 *
 * クライアント側の`signOut`だけではHttpOnlyクッキーが残り、`src/proxy.ts`が
 * 保護ルートへのアクセスを最長5日間（クッキーの有効期限まで）通してしまう（#80）。
 *
 * クッキーの削除に加えてリフレッシュトークンも失効させる。削除はあくまで
 * 「そのブラウザからクッキーを消す」だけで、値そのものを盗まれていた場合は
 * 有効なままだが、失効させると`tokensValidAfterTime`が更新され、
 * `verifySessionCookie(cookie, true)`（checkRevoked=true）が既存のクッキーを弾く。
 * 副作用として同一ユーザーの他端末のセッションも同時に無効になる。
 *
 * 失効に失敗したときはクッキーを削除せずエラーを返す。削除して成功を返すと
 * 画面上はログアウトできたように見えるのに、盗まれたクッキーは有効期限まで
 * 生き残るという、このIssueで直したはずの状態に戻ってしまうため。
 * クッキーを残しておけばクライアントはログイン状態のまま再試行できる。
 */
export async function DELETE(request: NextRequest) {
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value

    if (sessionCookie) {
        try {
            const decodedClaims = await getAuth().verifySessionCookie(sessionCookie)
            await getAuth().revokeRefreshTokens(decodedClaims.sub)
        } catch (error) {
            const code = getFirebaseErrorCode(error)
            if (!code || !ALREADY_INVALID_ERROR_CODES.has(code)) {
                console.error('Session revocation error:', error)
                return NextResponse.json(
                    { error: 'ログアウトに失敗しました。', code: 'revocation_failed' },
                    { status: 503 }
                )
            }
            // すでに無効なクッキー＝失効させる対象が無い。クッキーの削除だけ行う
        }
    }

    const response = NextResponse.json({ status: 'success' }, { status: 200 })
    response.cookies.set(buildSessionCookie('', 0))
    return response
}
