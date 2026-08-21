/**
 * `src/proxy.ts`（保護ルートの認証ゲート）の単体テスト。
 *
 * 見ているのは「どの失敗をどの理由コードで案内するか」。
 * ログイン画面（`useAuthRedirect`）はここで付く `error` を読んで文言を出し分けるため、
 * 原因を特定できない失敗を `session_expired`（＝有効期限切れ）と案内してしまうと、
 * 利用者は再ログインすれば直ると誤解する。
 *
 * 併せて fail-open していないこと（＝はっきり認証できたときだけ通すこと）も確認する。
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

import { proxy } from '@/proxy'

/** 保護ルートの一例。クエリ文字列が `redirect_to` に残ることも見たいので付けておく */
const PROTECTED_PATH = '/stores/images/12/edit/34?tab=topping'

const fetchMock = vi.fn()

function requestWithSession(sessionCookie?: string) {
    return new NextRequest(`http://localhost${PROTECTED_PATH}`, {
        headers: sessionCookie ? { cookie: `session=${sessionCookie}` } : {}
    })
}

/** 認証APIの応答を組み立てる。本文を渡さなければ JSON として壊れた応答になる */
function apiResponse(status: number, body?: unknown) {
    return new Response(body === undefined ? 'not json' : JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json' }
    })
}

/** リダイレクト応答から `error` クエリを取り出す。付いていなければ null */
function errorCodeOf(response: Response) {
    const location = response.headers.get('location')
    expect(location).not.toBeNull()
    return new URL(location as string).searchParams.get('error')
}

beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    // 失敗系は proxy が console.error を出す。テスト出力を汚さないよう握り潰す
    vi.spyOn(console, 'error').mockImplementation(() => { })
})

afterEach(() => {
    vi.unstubAllGlobals()
})

describe('proxy', () => {
    it('セッションクッキーが無ければ、理由を付けずにログインへ送る', async () => {
        const response = await proxy(requestWithSession())

        expect(response.status).toBe(307)
        const location = new URL(response.headers.get('location') as string)
        expect(location.pathname).toBe('/auth/login')
        // 未ログインは想定内なので理由は出さない
        expect(location.searchParams.get('error')).toBeNull()
        // 復帰先はクエリ文字列まで含めて渡す
        expect(location.searchParams.get('redirect_to')).toBe(PROTECTED_PATH)
        // 認証APIを呼ぶまでもない
        expect(fetchMock).not.toHaveBeenCalled()
    })

    it('認証APIが 200 かつ isAuth:true のときだけ通す', async () => {
        fetchMock.mockResolvedValue(apiResponse(200, { isAuth: true }))

        const response = await proxy(requestWithSession('valid-session-cookie'))

        // NextResponse.next() は「後続の処理へ進める」ことを示すヘッダを付ける
        expect(response.headers.get('x-middleware-next')).toBe('1')
        expect(response.headers.get('location')).toBeNull()
    })

    it('セッションクッキーを Bearer トークンとして渡し、リダイレクトは追跡しない', async () => {
        fetchMock.mockResolvedValue(apiResponse(200, { isAuth: true }))

        await proxy(requestWithSession('valid-session-cookie'))

        expect(fetchMock).toHaveBeenCalledTimes(1)
        const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit]
        expect(url.pathname).toBe('/api/auth/verify')
        expect(init.method).toBe('POST')
        expect((init.headers as Record<string, string>).Authorization).toBe(
            'Bearer valid-session-cookie'
        )
        // 追跡すると、検証APIの手前に挟まったリダイレクトの着地先（200）を
        // 認証成功と誤判定して fail-open する
        expect(init.redirect).toBe('manual')
        // タイムアウトを設けていないと、認証APIが応答しないときにゲート全体が固まる
        expect(init.signal).toBeInstanceOf(AbortSignal)
    })

    it('認証APIが明示的に未認証（401 + isAuth:false）ならセッション切れとして案内する', async () => {
        fetchMock.mockResolvedValue(apiResponse(401, { isAuth: false }))

        const response = await proxy(requestWithSession('expired-session-cookie'))

        expect(response.status).toBe(307)
        expect(errorCodeOf(response)).toBe('session_expired')
    })

    it.each([
        ['5xx', () => Promise.resolve(apiResponse(500, { message: 'internal error' }))],
        ['本文がJSONでない（WAFのHTML応答など）', () => Promise.resolve(apiResponse(200))],
        ['200 だが isAuth が無い', () => Promise.resolve(apiResponse(200, {}))],
        ['200 だが isAuth:false', () => Promise.resolve(apiResponse(200, { isAuth: false }))],
        ['401 だが isAuth が無い', () => Promise.resolve(apiResponse(401, {}))],
        [
            '手前にリダイレクトが挟まった（追跡しないので 3xx のまま届く）',
            () =>
                Promise.resolve(
                    new Response(null, { status: 307, headers: { location: '/sso' } })
                )
        ],
        ['タイムアウト', () => Promise.reject(new DOMException('signal timed out', 'TimeoutError'))],
        ['通信エラー', () => Promise.reject(new TypeError('fetch failed'))]
    ])('原因を特定できない失敗は auth_failed として案内する：%s', async (_name, respond) => {
        fetchMock.mockImplementation(respond)

        const response = await proxy(requestWithSession('some-session-cookie'))

        expect(response.status).toBe(307)
        expect(errorCodeOf(response)).toBe('auth_failed')
    })
})
