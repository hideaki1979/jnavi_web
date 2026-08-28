/**
 * `ApiClient` のエンベロープ実行時ガードの単体テスト。
 *
 * ## なぜこのテストが要るか
 *
 * `api.get<ApiEnvelope<T>>()` の型引数はコンパイラへの宣言でしかなく、
 * 実行時にレスポンスを見ていない。非2xx は axios が reject するので既存の catch に
 * 乗るが、「2xx なのにボディが契約と違う」経路だけは何も検知せず素通りし、
 * `data` が undefined のまま成功として `cacheLife("hours")` に載ってしまう（#98）。
 *
 * ガードはその素通りを塞ぐためのものなので、
 * 「通すべき形を通すこと」と「弾くべき形を漏らさず弾くこと」の両方を確認する。
 * 通し過ぎれば元の穴が残り、弾き過ぎれば正常なレスポンスで画面が落ちる。
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

import ApiClient, { ApiContractError } from '@/lib/ApiClient'

/** 契約どおりの成功レスポンス。テストごとに壊して使う */
const validEnvelope = { success: true, message: 'ok', data: [{ id: '1' }] }

beforeEach(() => {
    // ガードは契約違反を console.error に出す。
    // 期待どおりの失敗までテスト出力に混ざると本当の失敗が埋もれるため握り潰す
    // （vitest.config.ts の restoreMocks で毎回元に戻る）
    vi.spyOn(console, 'error').mockImplementation(() => { })
})

describe('assertEnvelope', () => {
    it('契約どおりのボディはそのまま通す', () => {
        const envelope = ApiClient.assertEnvelope<{ id: string }[]>(validEnvelope, 'GET /test')

        expect(envelope.success).toBe(true)
        expect(envelope.message).toBe('ok')
        expect(envelope.data).toEqual([{ id: '1' }])
    })

    // 想定する主な経路。プロキシやCDNが 200 でHTMLを返すと
    // axios はJSONパースに失敗してボディを文字列のまま渡してくる
    it('文字列ボディ（HTMLが返るケース）は弾く', () => {
        expect(() => ApiClient.assertEnvelope('<!doctype html><html>...', 'GET /test'))
            .toThrow(ApiContractError)
    })

    it.each([
        ['null', null],
        ['undefined', undefined],
        ['数値', 1],
        // 配列も typeof は "object" になるため、明示的に弾けているかを見る
        ['配列', [{ success: true, message: 'ok', data: [] }]]
    ])('オブジェクトでないボディは弾く：%s', (_name, body) => {
        expect(() => ApiClient.assertEnvelope(body, 'GET /test')).toThrow(ApiContractError)
    })

    it.each([
        ['success が無い', { message: 'ok', data: [] }],
        ['success が false', { success: false, message: 'ok', data: [] }],
        // バックエンドが返すのは boolean の true であり、文字列の "true" ではない
        ['success が文字列の "true"', { success: 'true', message: 'ok', data: [] }],
        ['message が無い', { success: true, data: [] }],
        ['message が文字列でない', { success: true, message: 1, data: [] }]
    ])('殻のキーが契約と違えば弾く：%s', (_name, body) => {
        expect(() => ApiClient.assertEnvelope(body, 'GET /test')).toThrow(ApiContractError)
    })

    // #98 の起点になったケース。この形が通ると data が undefined のまま
    // 「画像なし」として数時間キャッシュされる
    it('data キーが無ければ弾く', () => {
        expect(() => ApiClient.assertEnvelope({ success: true, message: 'ok' }, 'GET /test'))
            .toThrow(ApiContractError)
    })

    it('data が undefined なら弾く', () => {
        expect(() => ApiClient.assertEnvelope({ success: true, message: 'ok', data: undefined }, 'GET /test'))
            .toThrow(ApiContractError)
    })

    // 殻としては成立しているため通す。null を許容するかはペイロード側の判断で、
    // 殻の検証で決めることではない
    it('data が null なら通す', () => {
        const envelope = ApiClient.assertEnvelope<null>({ success: true, message: 'ok', data: null }, 'GET /test')

        expect(envelope.data).toBeNull()
    })

    it.each([
        ['空配列', []],
        ['空オブジェクト', {}],
        ['0', 0],
        ['空文字', ''],
        ['false', false]
    ])('falsy でも値が入っていれば通す：%s', (_name, data) => {
        expect(ApiClient.assertEnvelope({ success: true, message: 'ok', data }, 'GET /test').data)
            .toEqual(data)
    })
})

describe('assertMessageEnvelope', () => {
    it('data を持たないボディでも通す', () => {
        // data を読まない呼び出し向けの契約なので、data の有無は判定しない
        const envelope = ApiClient.assertMessageEnvelope({ success: true, message: '登録しました' }, 'POST /test')

        expect(envelope.message).toBe('登録しました')
    })

    it.each([
        ['文字列ボディ', 'Service Unavailable'],
        ['success が false', { success: false, error: 'NG' }],
        ['message が無い', { success: true }]
    ])('殻が契約と違えば弾く：%s', (_name, body) => {
        expect(() => ApiClient.assertMessageEnvelope(body, 'POST /test')).toThrow(ApiContractError)
    })
})

describe('契約違反の伝え方', () => {
    it('例外メッセージに呼び出しの識別子が入る', () => {
        expect(() => ApiClient.assertEnvelope({ success: true, message: 'ok' }, 'GET /maps'))
            .toThrow(/GET \/maps/)
    })

    // message は toActionError 経由で画面にも出る。
    // プロキシが返したHTML全文がそのまま表示されないことを担保する
    it('例外メッセージに受信ボディを載せない', () => {
        const secretish = '<html><body>internal stack trace</body></html>'

        expect(() => ApiClient.assertEnvelope(secretish, 'GET /maps'))
            .not.toThrow(/internal stack trace/)
    })

    it('診断情報はログに残す（呼び出し・ボディの型と長さ）', () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => { })

        expect(() => ApiClient.assertEnvelope('<!doctype html>', 'GET /maps')).toThrow()

        const logged = spy.mock.calls[0]?.[1] as string
        expect(logged).toContain('GET /maps')
        expect(logged).toContain('string(length=15,')
        // 中身を出さずとも「プロキシがエラーページを返した」までは分かるようにする
        expect(logged).toContain('html-like')
    })

    // 契約違反時のボディはバックエンドの手前にあるプロキシ等が組み立てたものでもあり得る。
    // 何が入っているかを列挙できない以上、長さで切り詰めるのではなく中身を持ち出さない
    it('受信ボディの中身はログに残さない', () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => { })
        const body = '<html><body>upstream 10.0.0.1 / at Object.handler (/srv/app.js:42)</body></html>'

        expect(() => ApiClient.assertEnvelope(body, 'GET /maps')).toThrow()

        const logged = spy.mock.calls[0]?.[1] as string
        expect(logged).not.toContain('10.0.0.1')
        expect(logged).not.toContain('/srv/app.js')
        expect(logged).not.toContain('<html>')
    })

    // Content-Type が JSON でないだけでボディはJSON、という切り分けができるようにする
    it('JSONに見える文字列ボディは中身を出さずに区別できる', () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => { })

        expect(() => ApiClient.assertEnvelope('{"success":true,"secret":"xxx"}', 'GET /maps')).toThrow()

        const logged = spy.mock.calls[0]?.[1] as string
        expect(logged).toContain('json-like')
        expect(logged).not.toContain('secret')
    })

    it('オブジェクトボディはキー名だけをログに残す', () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => { })

        expect(() => ApiClient.assertEnvelope({ success: true, message: 'ok' }, 'GET /maps')).toThrow()

        const logged = spy.mock.calls[0]?.[1] as string
        // どのキーが欠けているかが契約違反の原因そのものなので、キー名は残す。
        // ただし値は出さない
        expect(logged).toContain('object(keys=[success, message])')
    })

    it('オブジェクトボディの値はログに残さない', () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => { })
        const body = { success: true, message: 'ok', email: 'user@example.com' }

        expect(() => ApiClient.assertEnvelope(body, 'GET /maps')).toThrow()

        const logged = spy.mock.calls[0]?.[1] as string
        expect(logged).toContain('email')
        expect(logged).not.toContain('user@example.com')
    })

    // toActionError は Error インスタンスとして扱えることを前提に message を組み立てる
    it('Error として catch できる', () => {
        try {
            ApiClient.assertEnvelope('bad', 'GET /maps')
            expect.unreachable('契約違反なら throw されるはず')
        } catch (error) {
            expect(error).toBeInstanceOf(Error)
            expect(ApiClient.toActionError(error, '取得に失敗しました。').message)
                .toContain('取得に失敗しました。')
        }
    })
})

describe('toWriteActionError', () => {
    // 書き込みは 2xx を受けた時点でサーバー側の処理が成立している可能性が高い。
    // 通常の失敗と同じ見え方にすると再送信 → 重複登録を招く
    it('契約違反には確認を促す文言を付ける', () => {
        const error = new ApiContractError('POST /stores', '`data` が含まれていません')

        const payload = ApiClient.toWriteActionError(error, '店舗情報登録時にエラーが発生しました。')

        expect(payload.message).toContain('店舗情報登録時にエラーが発生しました。')
        expect(payload.message).toContain('処理は完了している可能性があります')
    })

    // storeClose の既定文言のように「。」で終わらないものがあるため、
    // そのまま連結すると文が繋がってしまう
    it('句点で終わらない文言でも文が繋がらない', () => {
        const error = new ApiContractError('PATCH /stores/1/close', '`message` が文字列ではありません')

        const payload = ApiClient.toWriteActionError(error, '店舗閉店処理時に予期せぬエラーが発生しました')

        expect(payload.message).toContain('発生しました。ただし')
    })

    it('契約違反以外は通常の失敗として扱う', () => {
        const payload = ApiClient.toWriteActionError(
            new Error('socket hang up'),
            '店舗情報登録時にエラーが発生しました。'
        )

        expect(payload.message).toContain('socket hang up')
        expect(payload.message).not.toContain('処理は完了している可能性があります')
    })
})
