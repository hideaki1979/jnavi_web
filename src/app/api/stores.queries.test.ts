/**
 * 読み取り関数にエンベロープガードが繋がっていることの単体テスト。
 *
 * ガード単体の判定は `src/lib/ApiClient.test.ts` で網羅しているので、
 * ここで見るのは配線だけ——契約違反が
 * 「throw → 既存の catch → `cacheLife("seconds")`」に落ちることを確認する。
 *
 * `cacheLife` の指定先が重要になる。#98 の問題は契約違反そのものより
 * **それが `cacheLife("hours")` で数時間キャッシュされる**ことにあるため、
 * 「失敗を返す」だけでなく「長寿命キャッシュに載せていない」ことまで見る。
 *
 * 代表として `getMapAll` を使う。他の読み取り関数も
 * 「ガード → cacheLife（成功）／catch → cacheLife("seconds")」の同じ形なので、
 * 全関数分を並べても確認できることは増えない。
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AxiosHeaders, type AxiosResponse } from 'axios'

/**
 * `next/cache` は Next.js のリクエストコンテキスト内でしか動かないため差し替える。
 * `vi.mock` の工場は巻き上げられて `const` を参照できないので `vi.hoisted` で作る。
 */
const { cacheLife, cacheTag } = vi.hoisted(() => ({
    cacheLife: vi.fn(),
    cacheTag: vi.fn()
}))

vi.mock('next/cache', () => ({ cacheLife, cacheTag }))

import { getMapAll } from '@/app/api/stores.queries'
import ApiClient from '@/lib/ApiClient'

/**
 * 対象モジュールは読み込み時に `ApiClient.getInstance()` を掴む。
 * シングルトンなのでここで取得したものと同一で、`get` を差し替えれば効く。
 */
const api = ApiClient.getInstance()

/** 判定に使うのは `data` だけだが、型を満たすために最低限の他フィールドも埋める */
function axiosResponse(data: unknown): AxiosResponse<unknown> {
    return {
        data,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: new AxiosHeaders() }
    }
}

const validMap = [
    { id: '1', latitude: '35.681236', longitude: '139.767125', store: { id: '1', store_name: '二郎', address: '東京' } }
]

beforeEach(() => {
    // 期待どおりの契約違反ログでテスト出力を埋めない
    vi.spyOn(console, 'error').mockImplementation(() => { })
})

describe('getMapAll', () => {
    it('契約どおりのレスポンスは本体を取り出して長寿命キャッシュに載せる', async () => {
        vi.spyOn(api, 'get').mockResolvedValue(
            axiosResponse({ success: true, message: 'MAP情報取得に成功しました。', data: validMap })
        )

        const result = await getMapAll()

        expect(result).toEqual({ success: true, data: validMap })
        expect(cacheLife).toHaveBeenCalledWith('hours')
    })

    // #98 の起点。以前はこの形が `{ success: true, data: undefined }` として
    // `cacheLife("hours")` に載り、画面には「該当なし」と無言で表示されていた
    it('2xx でも data が欠けていれば失敗として返し、短命キャッシュに倒す', async () => {
        vi.spyOn(api, 'get').mockResolvedValue(
            axiosResponse({ success: true, message: 'MAP情報取得に成功しました。' })
        )

        const result = await getMapAll()

        expect(result.success).toBe(false)
        expect(cacheLife).toHaveBeenCalledWith('seconds')
        expect(cacheLife).not.toHaveBeenCalledWith('hours')
    })

    // プロキシやCDNが 200 でHTMLを返すケース。axios はJSONパースに失敗して
    // ボディを文字列のまま渡すため、`res.data.data` は undefined になる
    it('2xx でもボディがHTMLなら失敗として返し、短命キャッシュに倒す', async () => {
        vi.spyOn(api, 'get').mockResolvedValue(axiosResponse('<!doctype html><html>502</html>'))

        const result = await getMapAll()

        expect(result.success).toBe(false)
        expect(cacheLife).toHaveBeenCalledWith('seconds')
        expect(cacheLife).not.toHaveBeenCalledWith('hours')
    })

    it('契約違反のメッセージは呼び出し元の文言を頭に付けて返す', async () => {
        vi.spyOn(api, 'get').mockResolvedValue(axiosResponse({ success: true, message: 'ok' }))

        const result = await getMapAll()

        // 画面に出るのはこの message。どの取得で失敗したかが分かる形になっていること
        expect(result.success ? '' : result.error.message).toContain('Map情報取得時にエラーが発生しました。')
        expect(result.success ? '' : result.error.message).toContain('GET /maps')
    })
})
