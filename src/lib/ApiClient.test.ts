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
import { AxiosError, AxiosHeaders, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'

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

describe('toActionError のログ', () => {
    const config: InternalAxiosRequestConfig = {
        headers: new AxiosHeaders(),
        method: 'post',
        url: '/users'
    }

    /** 指定したボディを返す非2xx を、axios が reject するのと同じ形で作る */
    function axiosErrorWith(data: unknown, status: number): AxiosError {
        const response: AxiosResponse = { data, status, statusText: '', headers: {}, config }
        return new AxiosError('Request failed', AxiosError.ERR_BAD_RESPONSE, config, undefined, response)
    }

    // エラーボディも外部（プロキシ等）が組み立てたものであり得るため、
    // 契約違反時のボディと同じ扱いにする
    it('エラーボディの中身は残さず、型と見た目だけを残す', () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => { })
        const error = axiosErrorWith('<html><body>upstream 10.0.0.1 / at handler (/srv/app.js:42)</body></html>', 502)

        ApiClient.toActionError(error, 'テスト')

        const logged = spy.mock.calls[0]?.[1] as string
        expect(logged).toContain('html-like')
        expect(logged).not.toContain('10.0.0.1')
        expect(logged).not.toContain('/srv/app.js')
    })

    // 同じ 401 でも TokenExpired / InvalidToken / Unauthorized で対応が変わる。
    // payload には載らないため、列挙値であるこれだけは明示的に残す
    it('認証エラーの種別は残す', () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => { })
        const error = axiosErrorWith({ status: 'TokenExpired', message: 'トークンの有効期限が切れています' }, 401)

        ApiClient.toActionError(error, 'テスト')

        expect(spy.mock.calls[0]?.[1] as string).toContain('TokenExpired')
    })

    // バックエンドは自身のログから value を落としている（zodValidation.ts）。
    // レスポンスには残るため、フロントがそれをそのまま出力すると
    // 落としたはずの値をこちら側で復活させてしまう
    it('バリデーション詳細の value はログに残さない', () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => { })
        const error = axiosErrorWith({
            success: false,
            error: 'バリデーションエラー発生：入力値に誤りがあります。',
            details: [{
                type: 'field',
                msg: '有効なメールアドレスを入力してください',
                path: 'email',
                location: 'body',
                value: 'user@example.com'
            }]
        }, 400)

        ApiClient.toActionError(error, 'テスト')

        const logged = spy.mock.calls[0]?.[1] as string
        expect(logged).not.toContain('user@example.com')
        // どの項目がどのルールで落ちたかは追える
        expect(logged).toContain('email')
        expect(logged).toContain('有効なメールアドレスを入力してください')
    })

    it('画面表示用の戻り値からは value を落とさない', () => {
        vi.spyOn(console, 'error').mockImplementation(() => { })
        const error = axiosErrorWith({
            success: false,
            error: 'バリデーションエラー発生：入力値に誤りがあります。',
            details: [{ msg: '不正な値です', path: 'email', value: 'user@example.com' }]
        }, 400)

        const payload = ApiClient.toActionError(error, 'テスト')

        // 変更したのはログだけで、クライアントへ返す内容は従来どおり
        expect(payload.errors?.[0]?.value).toBe('user@example.com')
    })
})

describe('toActionError のレスポンス由来の値の扱い', () => {
    const config: InternalAxiosRequestConfig = {
        headers: new AxiosHeaders(),
        method: 'post',
        url: '/users'
    }

    function axiosErrorWith(data: unknown, status: number): AxiosError {
        const response: AxiosResponse = { data, status, statusText: '', headers: {}, config }
        return new AxiosError('Request failed', AxiosError.ERR_BAD_RESPONSE, config, undefined, response)
    }

    beforeEach(() => {
        vi.spyOn(console, 'error').mockImplementation(() => { })
    })

    // AxiosError<ApiErrorResponse> の型引数は宣言であって検証ではない（#98 と同じ構図）。
    // status をそのまま出すと、応答した誰かが決めた任意の文字列がログに流れ込む
    it('既知の列挙値でない authStatus はログに出さない', () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => { })
        const error = axiosErrorWith({ status: '<script>alert(1)</script>', message: 'NG' }, 401)

        ApiClient.toActionError(error, 'テスト')

        expect(spy.mock.calls[0]?.[1] as string).not.toContain('alert(1)')
    })

    it.each(['Unauthorized', 'TokenExpired', 'InvalidToken'])(
        '既知の認証エラー種別は残す：%s',
        (authStatus) => {
            const spy = vi.spyOn(console, 'error').mockImplementation(() => { })

            ApiClient.toActionError(axiosErrorWith({ status: authStatus, message: 'NG' }, 401), 'テスト')

            expect(spy.mock.calls[0]?.[1] as string).toContain(authStatus)
        }
    )

    // details は Array.isArray しか見ていなかったため、要素が null だと
    // value を落とす分割代入が TypeError で落ちていた。
    // catch の中で起きるのでエラー処理そのものが壊れる
    it.each([
        ['null 要素', [null]],
        ['undefined 要素', [undefined]],
        ['文字列要素', ['壊れた詳細']],
        ['数値要素', [42]],
        ['配列ですらない', 'details']
    ])('details の形が壊れていても落ちない：%s', (_name, details) => {
        const error = axiosErrorWith({ success: false, error: 'エラー', details }, 400)

        expect(() => ApiClient.toActionError(error, 'テスト')).not.toThrow()
    })

    it('扱えない details の要素は取り除く', () => {
        const error = axiosErrorWith({
            success: false,
            error: 'エラー',
            details: [null, { msg: '必須です', path: 'email' }, '壊れた詳細']
        }, 400)

        const payload = ApiClient.toActionError(error, 'テスト')

        // `ExpressValidationError[]` と宣言している以上、その形の要素だけを載せる
        expect(payload.errors).toEqual([{ msg: '必須です', path: 'email' }])
    })

    // 元オブジェクトを素通しすると、msg を確かめただけで ExpressValidationError と
    // 名乗ることになる。宣言していないキーが画面にもログにも流れていく
    it('契約にないプロパティは画面表示用の戻り値から取り除く', () => {
        const error = axiosErrorWith({
            success: false,
            error: 'エラー',
            details: [{ msg: '必須です', path: 'email', token: 'secret-token' }]
        }, 400)

        const payload = ApiClient.toActionError(error, 'テスト')

        expect(payload.errors).toEqual([{ msg: '必須です', path: 'email' }])
    })

    // redactValidationErrors が落とすのは value だけなので、
    // 契約外のキーは組み直しの段階で除いておく必要がある
    it('契約にないプロパティはログにも残さない', () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => { })
        const error = axiosErrorWith({
            success: false,
            error: 'エラー',
            details: [{ msg: '必須です', path: 'email', token: 'secret-token' }]
        }, 400)

        ApiClient.toActionError(error, 'テスト')

        expect(spy.mock.calls[0]?.[1] as string).not.toContain('secret-token')
    })

    // 宣言と違う型の値を通すと `[${fieldName}]` が "[object Object]" になる。
    // クラッシュはしないが、意味の無い文字列が利用者に見える
    it('宣言と型が違う項目は落とす', () => {
        const error = axiosErrorWith({
            success: false,
            error: 'エラー',
            details: [{ msg: '必須です', path: {}, location: 42 }]
        }, 400)

        const payload = ApiClient.toActionError(error, 'テスト')

        expect(payload.errors).toEqual([{ msg: '必須です' }])
    })

    it('契約どおりの項目はすべて残す', () => {
        const detail = {
            type: 'field',
            msg: '有効なメールアドレスを入力してください',
            path: 'email',
            param: 'email',
            location: 'body',
            value: 'not-an-email'
        }
        const error = axiosErrorWith({ success: false, error: 'エラー', details: [detail] }, 400)

        const payload = ApiClient.toActionError(error, 'テスト')

        expect(payload.errors).toEqual([detail])
    })

    // `||` で繋いだままだと文字列以外もテンプレートリテラルに入り、
    // `[object Object]` が画面に出る
    it('error が文字列でなければ画面表示に混ぜない', () => {
        const error = axiosErrorWith({ success: false, error: { nested: 'object' } }, 500)

        const payload = ApiClient.toActionError(error, 'テスト')

        expect(payload.message).not.toContain('[object Object]')
        expect(payload.message).toContain('Request failed')
    })
})
