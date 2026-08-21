/**
 * `src/utils/redirectPath.ts`（`redirect_to` の検証）の単体テスト。
 *
 * `redirect_to` はURLクエリ経由で外部から自由に指定できるため、
 * ここを通り抜けた値がそのまま遷移先になるとオープンリダイレクトになる。
 * 「自サイト内の相対パスだけを通す」という判定が、
 * 外部URL・プロトコル相対URL・制御文字のいずれにも崩されないことを確認する。
 *
 * 併せて、通すべき内部パスまで既定値に潰していないこと（＝過剰に弾いていないこと）も見る。
 */
import { describe, expect, it } from 'vitest'

import {
    buildLoginPath,
    DEFAULT_REDIRECT_PATH,
    LOGIN_PATH,
    sanitizeRedirectPath
} from '@/utils/redirectPath'

describe('sanitizeRedirectPath', () => {
    it.each([
        ['null', null],
        ['undefined', undefined],
        ['空文字', '']
    ])('値が無ければ既定の遷移先を返す：%s', (_name, value) => {
        expect(sanitizeRedirectPath(value)).toBe(DEFAULT_REDIRECT_PATH)
    })

    it.each([
        ['単純なパス', '/stores/images/12'],
        ['クエリ付き', '/stores/images/12/edit/34?tab=topping'],
        ['クエリとハッシュ付き', '/stores/images/12/edit/34?tab=topping#detail'],
        // 除外するのは `/auth/login` `/auth/signup` `/api` とその配下だけ。
        // 単なる前方一致で判定すると、無関係なパスまで巻き添えで弾いてしまう
        ['除外パスと文字列の先頭が同じだけのパス', '/authentication'],
        ['除外パスと文字列の先頭が同じだけのパス（api）', '/apiary']
    ])('自サイト内のパスはそのまま通す：%s', (_name, value) => {
        expect(sanitizeRedirectPath(value)).toBe(value)
    })

    it.each([
        ['絶対URL（http）', 'http://evil.example.com/steal'],
        ['絶対URL（https）', 'https://evil.example.com/steal'],
        // `//` で始まる値はブラウザにプロトコル相対URLとして解釈され、外部へ出る
        ['プロトコル相対URL', '//evil.example.com/steal'],
        ['バックスラッシュ版のプロトコル相対URL', '/\\evil.example.com/steal'],
        ['スキーム付き（javascript:）', 'javascript:alert(1)'],
        ['`/` 始まりでない相対パス', 'stores/map'],
        // 同一オリジンでも絶対URLの形は通さない。オリジンの一致に頼ると、
        // 環境ごとのホスト名の違いがそのまま判定の穴になる
        ['同一オリジンの絶対URL', 'http://localhost/stores/map']
    ])('自サイト外へ出うる値は既定の遷移先に倒す：%s', (_name, value) => {
        expect(sanitizeRedirectPath(value)).toBe(DEFAULT_REDIRECT_PATH)
    })

    // 検証対象の値には既定の遷移先と違うパスを使う。`/stores/map`（＝既定値）で書くと、
    // URL パーサが制御文字を捨てた結果と既定値が同じになり、素通りしても気付けない
    it.each([
        ['改行', '/stores/images/12\n'],
        ['復帰', '/stores/images/12\r'],
        ['タブ', '/stores/\timages/12'],
        ['NUL', '/stores/images/12\u0000'],
        ['DEL', '/stores/images/12\u007f']
    ])('制御文字を含む値は既定の遷移先に倒す：%s', (_name, value) => {
        expect(sanitizeRedirectPath(value)).toBe(DEFAULT_REDIRECT_PATH)
    })

    it.each([
        ['ログイン画面自身', LOGIN_PATH],
        ['ログイン画面（クエリ付き）', `${LOGIN_PATH}?error=session_expired`],
        ['ログイン画面の配下', `${LOGIN_PATH}/callback`],
        ['サインアップ画面', '/auth/signup'],
        ['API', '/api/auth/session']
    ])('戻すとループする・意味の無いパスは既定の遷移先に倒す：%s', (_name, value) => {
        expect(sanitizeRedirectPath(value)).toBe(DEFAULT_REDIRECT_PATH)
    })
})

describe('buildLoginPath', () => {
    it('復帰先を redirect_to に載せる', () => {
        const returnPath = '/stores/images/12/edit/34?tab=topping'

        const loginPath = buildLoginPath(returnPath)

        const url = new URL(loginPath, 'http://localhost')
        expect(url.pathname).toBe(LOGIN_PATH)
        expect(url.searchParams.get('redirect_to')).toBe(returnPath)
        // 復帰先のクエリをエンコードせずに繋ぐと、`tab` がログイン画面自身のクエリとして
        // 混ざり、復帰先が途中で切れる。`?` が1つしか無いことで確認する
        expect(loginPath.split('?')).toHaveLength(2)
    })

    it.each([
        ['値が無い', null],
        ['既定の遷移先そのもの', DEFAULT_REDIRECT_PATH],
        ['外部URL', 'https://evil.example.com/steal']
    ])('復帰先が既定の遷移先に落ちるならクエリを付けない：%s', (_name, returnPath) => {
        expect(buildLoginPath(returnPath)).toBe(LOGIN_PATH)
    })
})
