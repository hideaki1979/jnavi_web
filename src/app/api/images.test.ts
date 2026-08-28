/**
 * 書き込み系でエンベロープの契約違反が起きたときの扱いの単体テスト。
 *
 * ## 読み取りと同じ扱いにできない理由
 *
 * 読み取りは契約違反を失敗に倒せばよい（副作用が無く、長寿命キャッシュに
 * 載せないことが目的のため）。書き込みは事情が違う。
 * **2xx が返っている以上、サーバー側の処理は成立している可能性が高い**ので、
 * 通常の失敗と同じ扱いにすると次の2つが同時に起きる。
 *
 * 1. `updateTag` が実行されず、一覧が古いまま＝画面に結果が出てこない
 * 2. 利用者が「失敗した」と判断して再送信する → 重複登録
 *
 * `src/app/api/images.ts` はもともと `updateTag` を try の外に置くことで
 * 1 と 2 を避ける作りになっていた。実行時ガードを足したことで
 * その配慮が素通りしていないことをここで担保する。
 *
 * 代表として `uploadStoreImage`（重複が最も高くつく）と
 * `deleteStoreImage`（無効化するタグが2つある）を見る。
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios'

const { updateTag, cacheLife, cacheTag } = vi.hoisted(() => ({
    updateTag: vi.fn(),
    cacheLife: vi.fn(),
    cacheTag: vi.fn()
}))

vi.mock('next/cache', () => ({ updateTag, cacheLife, cacheTag }))

import { deleteStoreImage, uploadStoreImage } from '@/app/api/images'
import ApiClient from '@/lib/ApiClient'

const api = ApiClient.getInstance()

function axiosResponse(data: unknown): AxiosResponse<unknown> {
    return {
        data,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: new AxiosHeaders() }
    }
}

const imageData = {
    store_id: '1',
    user_id: 'test-uid',
    menu_type: 1,
    menu_name: 'ラーメン',
    image_base64: 'data:image/jpeg;base64,xxx'
}

beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => { })
})

describe('uploadStoreImage', () => {
    it('契約どおりのレスポンスは本体を返し、一覧タグを無効化する', async () => {
        vi.spyOn(api, 'post').mockResolvedValue(
            axiosResponse({
                success: true,
                message: '画像を登録しました。',
                data: { imageId: '10', imageUrl: 'https://example.com/10.jpg' }
            })
        )

        const result = await uploadStoreImage('1', imageData, 'token')

        expect(result).toEqual({
            success: true,
            data: { imageId: '10', imageUrl: 'https://example.com/10.jpg' }
        })
        expect(updateTag).toHaveBeenCalledWith('store-1-images')
    })

    // 本体（imageId / imageUrl）が取れない以上、成功とは返せない。
    // ただしアップロード自体は成立している可能性が高いので、
    // 一覧が古いまま残らないよう無効化だけは通す
    it('2xx でも本体が読めなければ失敗を返すが、一覧タグは無効化する', async () => {
        vi.spyOn(api, 'post').mockResolvedValue(
            axiosResponse({ success: true, message: '画像を登録しました。' })
        )

        const result = await uploadStoreImage('1', imageData, 'token')

        expect(result.success).toBe(false)
        expect(updateTag).toHaveBeenCalledWith('store-1-images')
    })

    it('契約違反のメッセージは再送信ではなく確認を促す', async () => {
        vi.spyOn(api, 'post').mockResolvedValue(axiosResponse('<!doctype html>'))

        const result = await uploadStoreImage('1', imageData, 'token')

        const message = result.success ? '' : result.error.message
        expect(message).toContain('画像アップロード処理でエラーが発生しました。')
        expect(message).toContain('処理は完了している可能性があります')
        // 画面に出る文言なので、受信したボディは混ぜない
        expect(message).not.toContain('<!doctype html>')
    })

    // 4xx / 5xx は axios が reject する経路。この場合サーバー側の書き込みは
    // 成立していないので、キャッシュを無効化する理由が無い
    it('APIがエラーを返した場合はタグを無効化しない', async () => {
        vi.spyOn(api, 'post').mockRejectedValue(new AxiosError('Request failed with status code 500'))

        const result = await uploadStoreImage('1', imageData, 'token')

        expect(result.success).toBe(false)
        expect(updateTag).not.toHaveBeenCalled()
    })

    it('APIエラーのメッセージには確認を促す文言を付けない', async () => {
        vi.spyOn(api, 'post').mockRejectedValue(new AxiosError('Request failed with status code 500'))

        const result = await uploadStoreImage('1', imageData, 'token')

        expect(result.success ? '' : result.error.message).not.toContain('処理は完了している可能性があります')
    })
})

describe('deleteStoreImage', () => {
    it('契約違反でも成功時と同じタグをすべて無効化する', async () => {
        vi.spyOn(api, 'delete').mockResolvedValue(
            axiosResponse({ success: true, message: '削除しました。' })
        )

        const result = await deleteStoreImage('1', '10', 'token')

        expect(result.success).toBe(false)
        // 成功時と同じ2つ。片方だけ無効化すると詳細と一覧で表示が食い違う
        expect(updateTag).toHaveBeenCalledWith('image-1-10')
        expect(updateTag).toHaveBeenCalledWith('store-1-images')
    })

    it('APIがエラーを返した場合はタグを無効化しない', async () => {
        vi.spyOn(api, 'delete').mockRejectedValue(new AxiosError('Not Found'))

        const result = await deleteStoreImage('1', '10', 'token')

        expect(result.success).toBe(false)
        expect(updateTag).not.toHaveBeenCalled()
    })
})
