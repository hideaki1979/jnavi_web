/**
 * `src/lib/server/firebaseAdmin.ts` の単体テスト。
 *
 * このモジュールは import した時点で Admin SDK を初期化する（副作用がある）。
 * そのため各テストで `vi.resetModules()` してから動的 import し、
 * 初期化そのものを毎回やり直させている。
 *
 * 環境変数が欠けたときに throw することを確かめるのは、
 * ここで落とさないと `cert()` に `undefined` が渡り、
 * 「初期化は通ったのに検証だけが失敗する」形で後段に出てくるため（#81）。
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getApps, initializeApp, cert, getAuth, verifySessionCookieMock } = vi.hoisted(() => ({
    getApps: vi.fn(),
    initializeApp: vi.fn(),
    cert: vi.fn((serviceAccount: unknown) => ({ __credential: serviceAccount })),
    getAuth: vi.fn(),
    verifySessionCookieMock: vi.fn()
}))

vi.mock('firebase-admin/app', () => ({ getApps, initializeApp, cert }))
vi.mock('firebase-admin/auth', () => ({ getAuth }))

/** Vercel の環境変数と同じく、改行が `\n` の2文字で入っている状態を再現する */
const ESCAPED_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\\nabc\\ndef\\n-----END PRIVATE KEY-----\\n'
const DECODED_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\nabc\ndef\n-----END PRIVATE KEY-----\n'

const REQUIRED_ENV = {
    FIREBASE_PROJECT_ID: 'test-project',
    FIREBASE_CLIENT_EMAIL: 'test@test-project.iam.gserviceaccount.com',
    FIREBASE_PRIVATE_KEY: ESCAPED_PRIVATE_KEY
} as const

function stubEnv(env: Partial<Record<keyof typeof REQUIRED_ENV, string | undefined>>) {
    for (const [key, value] of Object.entries(env)) {
        vi.stubEnv(key, value)
    }
}

/** 初期化をやり直させたうえで読み込む */
async function importFirebaseAdmin() {
    vi.resetModules()
    return import('@/lib/server/firebaseAdmin')
}

beforeEach(() => {
    // 既定は「まだ初期化されていない」＝初期化処理を通る状態
    getApps.mockReturnValue([])
    getAuth.mockReturnValue({ verifySessionCookie: verifySessionCookieMock })
    vi.spyOn(console, 'error').mockImplementation(() => { })

    return () => {
        vi.unstubAllEnvs()
    }
})

describe('Admin SDK の初期化', () => {
    it.each(Object.keys(REQUIRED_ENV) as (keyof typeof REQUIRED_ENV)[])(
        '%s が欠けていると読み込み時に落ちる',
        async (missingKey) => {
            stubEnv({ ...REQUIRED_ENV, [missingKey]: undefined })

            await expect(importFirebaseAdmin()).rejects.toThrow(
                'Firebase Admin SDKの初期化に必要な環境変数が設定されていません。'
            )
            expect(initializeApp).not.toHaveBeenCalled()
        }
    )

    it('空文字も未設定として扱う', async () => {
        stubEnv({ ...REQUIRED_ENV, FIREBASE_PRIVATE_KEY: '' })

        await expect(importFirebaseAdmin()).rejects.toThrow(
            'Firebase Admin SDKの初期化に必要な環境変数が設定されていません。'
        )
        expect(initializeApp).not.toHaveBeenCalled()
    })

    it('環境変数が揃っていれば、秘密鍵の改行を戻して初期化する', async () => {
        stubEnv(REQUIRED_ENV)

        await importFirebaseAdmin()

        expect(cert).toHaveBeenCalledWith({
            projectId: REQUIRED_ENV.FIREBASE_PROJECT_ID,
            clientEmail: REQUIRED_ENV.FIREBASE_CLIENT_EMAIL,
            // `\n` の2文字のまま渡すと鍵として読めず、署名の検証に失敗する
            privateKey: DECODED_PRIVATE_KEY
        })
        expect(initializeApp).toHaveBeenCalledTimes(1)
    })

    it('初期化済みなら再初期化しない', async () => {
        getApps.mockReturnValue([{ name: '[DEFAULT]' }])
        // 初期化済みの場合は環境変数を見にいかない（欠けていても落ちない）
        stubEnv({ FIREBASE_PROJECT_ID: undefined, FIREBASE_CLIENT_EMAIL: undefined, FIREBASE_PRIVATE_KEY: undefined })

        await expect(importFirebaseAdmin()).resolves.toBeDefined()
        expect(initializeApp).not.toHaveBeenCalled()
    })
})

describe('verifySessionCookie', () => {
    beforeEach(() => {
        stubEnv(REQUIRED_ENV)
    })

    it('失効チェック付きで検証し、デコード結果を返す', async () => {
        const decoded = { uid: 'test-uid', sub: 'test-uid' }
        verifySessionCookieMock.mockResolvedValue(decoded)

        const { verifySessionCookie } = await importFirebaseAdmin()

        await expect(verifySessionCookie('valid-session-cookie')).resolves.toBe(decoded)
        // 第2引数の checkRevoked を落とすと、ログアウト（revokeRefreshTokens）済みの
        // クッキーが有効期限まで通ってしまう（#80）
        expect(verifySessionCookieMock).toHaveBeenCalledWith('valid-session-cookie', true)
    })

    it('検証に失敗したら null を返す', async () => {
        verifySessionCookieMock.mockRejectedValue(new Error('session cookie revoked'))

        const { verifySessionCookie } = await importFirebaseAdmin()

        await expect(verifySessionCookie('revoked-session-cookie')).resolves.toBeNull()
    })

    it('空文字なら検証にも進まず null を返す', async () => {
        const { verifySessionCookie } = await importFirebaseAdmin()

        await expect(verifySessionCookie('')).resolves.toBeNull()
        expect(verifySessionCookieMock).not.toHaveBeenCalled()
    })
})
