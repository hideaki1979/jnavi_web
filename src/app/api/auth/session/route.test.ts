/**
 * `POST/DELETE /api/auth/session` の単体テスト。
 *
 * ## なぜモックで書くか
 *
 * `POST` は「直近5分以内にサインインしたIDトークンだけをセッションクッキーへ引き換える」
 * という境界を持つ（#79）。この境界は実トークンでも確認できるが、
 * 使い捨ての Firebase ユーザーを作り、`auth_time` からの経過秒を測りながら
 * dev サーバーへ投げる形になり、1回の実行に約5分かかるうえ CI で回せない（#81）。
 *
 * ここでは `firebase-admin/auth` を差し替えて `auth_time` を直接与え、
 * 時刻も固定して、299秒・300秒・301秒を確定的に検証する。
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

// 下の `vi.mock` はファイル先頭へ巻き上げられるため、この import より先に効く
import { DELETE, POST } from '@/app/api/auth/session/route'

/**
 * `vi.mock` の工場はファイル先頭へ巻き上げられるため、通常の `const` を参照できない。
 * スパイの生成も一緒に巻き上げる必要があるので `vi.hoisted` を使う。
 */
const { verifyIdToken, createSessionCookie, verifySessionCookie, revokeRefreshTokens } = vi.hoisted(
    () => ({
        verifyIdToken: vi.fn(),
        createSessionCookie: vi.fn(),
        verifySessionCookie: vi.fn(),
        revokeRefreshTokens: vi.fn()
    })
)

vi.mock('firebase-admin/auth', () => ({
    getAuth: () => ({ verifyIdToken, createSessionCookie, verifySessionCookie, revokeRefreshTokens })
}))

/**
 * ルートは Admin SDK の初期化のためだけにこのモジュールを import している。
 * 実際の初期化にはサービスアカウントの秘密鍵が要るので、空モジュールに差し替える。
 */
vi.mock('@/lib/server/firebaseAdmin', () => ({}))

/** 検証の基準時刻。値そのものに意味は無い（固定できていることが重要） */
const NOW_MS = Date.UTC(2026, 0, 1, 0, 0, 0)

/** ルートが受け付ける「直近のサインイン」の猶予（秒）。ルート側の定数と対で持つ */
const RECENT_SIGN_IN_WINDOW_SEC = 300

const SESSION_EXPIRES_IN_MS = 60 * 60 * 24 * 5 * 1000

/** `auth_time` が「いま」から `secondsAgo` 秒前だったことにする */
function decodedTokenWithAuthTime(secondsAgo: number) {
    return { uid: 'test-uid', auth_time: NOW_MS / 1000 - secondsAgo }
}

function postRequest(authHeader?: string) {
    return new NextRequest('http://localhost/api/auth/session', {
        method: 'POST',
        headers: authHeader ? { Authorization: authHeader } : {}
    })
}

function deleteRequest(sessionCookie?: string) {
    return new NextRequest('http://localhost/api/auth/session', {
        method: 'DELETE',
        headers: sessionCookie ? { cookie: `session=${sessionCookie}` } : {}
    })
}

beforeEach(() => {
    // Date だけを固定する。ルートは Date.now() しか使わないので、
    // タイマー全体を差し替えると await の挙動まで巻き込むリスクだけが増える
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(NOW_MS)
    // 失敗系はルートが console.error を出す。テスト出力を汚さないよう握り潰す
    vi.spyOn(console, 'error').mockImplementation(() => { })

    return () => {
        vi.useRealTimers()
    }
})

describe('POST /api/auth/session', () => {
    describe('auth_time の境界（直近5分以内のサインインのみ受け付ける）', () => {
        it(`${RECENT_SIGN_IN_WINDOW_SEC - 1}秒前のサインインならセッションクッキーを発行する`, async () => {
            verifyIdToken.mockResolvedValue(decodedTokenWithAuthTime(RECENT_SIGN_IN_WINDOW_SEC - 1))
            createSessionCookie.mockResolvedValue('created-session-cookie')

            const response = await POST(postRequest('Bearer valid-id-token'))

            expect(response.status).toBe(200)
            await expect(response.json()).resolves.toEqual({ status: 'success' })
            expect(createSessionCookie).toHaveBeenCalledWith('valid-id-token', {
                expiresIn: SESSION_EXPIRES_IN_MS
            })
            expect(response.cookies.get('session')?.value).toBe('created-session-cookie')
        })

        it(`ちょうど${RECENT_SIGN_IN_WINDOW_SEC}秒前は受け付けず、クッキーも作らない`, async () => {
            verifyIdToken.mockResolvedValue(decodedTokenWithAuthTime(RECENT_SIGN_IN_WINDOW_SEC))

            const response = await POST(postRequest('Bearer valid-id-token'))

            expect(response.status).toBe(401)
            await expect(response.json()).resolves.toMatchObject({ code: 'recent_sign_in_required' })
            // 「発行しない」だけでなく「作りにいかない」ことまで見る。
            // createSessionCookie を呼んでから捨てる実装になると、
            // 盗用されたIDトークンでも Firebase 側にクッキーが作られてしまう
            expect(createSessionCookie).not.toHaveBeenCalled()
            expect(response.headers.get('set-cookie')).toBeNull()
        })

        it(`${RECENT_SIGN_IN_WINDOW_SEC + 1}秒前は受け付けない`, async () => {
            verifyIdToken.mockResolvedValue(decodedTokenWithAuthTime(RECENT_SIGN_IN_WINDOW_SEC + 1))

            const response = await POST(postRequest('Bearer valid-id-token'))

            expect(response.status).toBe(401)
            await expect(response.json()).resolves.toMatchObject({ code: 'recent_sign_in_required' })
            expect(createSessionCookie).not.toHaveBeenCalled()
            expect(response.headers.get('set-cookie')).toBeNull()
        })
    })

    it('IDトークンの検証に失敗したらクッキーを発行しない', async () => {
        verifyIdToken.mockRejectedValue(new Error('Firebase ID token has invalid signature.'))

        const response = await POST(postRequest('Bearer tampered-id-token'))

        expect(response.status).toBe(401)
        expect(createSessionCookie).not.toHaveBeenCalled()
        expect(response.headers.get('set-cookie')).toBeNull()
    })

    it.each([
        ['ヘッダが無い', undefined],
        ['Bearer 以外のスキーム', 'Basic dXNlcjpwYXNz'],
        ['スキームだけでトークンが無い', 'Bearer '],
        ['前後の一致だけでは通さない（bearer 小文字）', 'bearer valid-id-token']
    ])('Authorization ヘッダが不正なら検証にも進まない：%s', async (_name, authHeader) => {
        const response = await POST(postRequest(authHeader))

        expect(response.status).toBe(401)
        expect(verifyIdToken).not.toHaveBeenCalled()
        expect(createSessionCookie).not.toHaveBeenCalled()
        expect(response.headers.get('set-cookie')).toBeNull()
    })

    it('発行するクッキーは HttpOnly・SameSite=Lax・path=/ で、有効期限は5日', async () => {
        verifyIdToken.mockResolvedValue(decodedTokenWithAuthTime(0))
        createSessionCookie.mockResolvedValue('created-session-cookie')

        const response = await POST(postRequest('Bearer valid-id-token'))

        expect(response.cookies.get('session')).toMatchObject({
            name: 'session',
            httpOnly: true,
            sameSite: 'lax',
            path: '/',
            maxAge: SESSION_EXPIRES_IN_MS / 1000
        })
    })
})

describe('DELETE /api/auth/session', () => {
    it('クッキーを削除し、リフレッシュトークンも失効させる', async () => {
        verifySessionCookie.mockResolvedValue({ sub: 'test-uid' })
        revokeRefreshTokens.mockResolvedValue(undefined)

        const response = await DELETE(deleteRequest('valid-session-cookie'))

        expect(response.status).toBe(200)
        expect(revokeRefreshTokens).toHaveBeenCalledWith('test-uid')
        // maxAge=0（＝即時失効）で上書きするのが削除。値が空であることも併せて見る
        expect(response.cookies.get('session')).toMatchObject({ value: '', maxAge: 0 })
    })

    it('失効させる対象が無いクッキー（期限切れ等）は成功として扱う', async () => {
        verifySessionCookie.mockRejectedValue(
            Object.assign(new Error('session cookie expired'), {
                code: 'auth/session-cookie-expired'
            })
        )

        const response = await DELETE(deleteRequest('expired-session-cookie'))

        expect(response.status).toBe(200)
        expect(revokeRefreshTokens).not.toHaveBeenCalled()
        expect(response.cookies.get('session')).toMatchObject({ value: '', maxAge: 0 })
    })

    it('失効できたか分からない失敗ではクッキーを消さずに 503 を返す', async () => {
        // クッキーを消して成功を返すと、画面上はログアウトできたように見えるのに
        // 盗まれたクッキーは有効期限まで生き残る（#80 で直したはずの状態に戻る）
        verifySessionCookie.mockRejectedValue(
            Object.assign(new Error('internal error'), { code: 'auth/internal-error' })
        )

        const response = await DELETE(deleteRequest('valid-session-cookie'))

        expect(response.status).toBe(503)
        await expect(response.json()).resolves.toMatchObject({ code: 'revocation_failed' })
        expect(response.headers.get('set-cookie')).toBeNull()
    })

    it('クッキーが無ければ失効処理は行わず、削除だけ返す', async () => {
        const response = await DELETE(deleteRequest())

        expect(response.status).toBe(200)
        expect(verifySessionCookie).not.toHaveBeenCalled()
        expect(revokeRefreshTokens).not.toHaveBeenCalled()
        expect(response.cookies.get('session')).toMatchObject({ value: '', maxAge: 0 })
    })
})
