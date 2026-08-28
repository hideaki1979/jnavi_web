/**
 * スタブバックエンドが返す固定データ。
 *
 * 形は実バックエンド（nodedeploytest）のレスポンスに合わせている。
 * とくに次の2点は実装に寄せてあるので、変更するときは注意すること。
 *
 * 1. 成功レスポンスは必ず `{ success: true, message: string, data: T }` の3キー
 *    （`src/types/api.ts` の ApiEnvelope）。第1キーは boolean の `success` であり
 *    文字列の `status` ではない。
 * 2. Prisma の BigInt / Decimal は JSON 上では**文字列**で届く。
 *    そのため `id`・`latitude`・`longitude` は数値ではなく文字列で返している。
 *    実際 `StoreMap.tsx` は `Number(store.latitude)` と明示変換しており、
 *    ここで数値を返すとその変換が効いているかを検証できなくなる。
 */

/** GET /maps のレスポンス本体（`MapData[]`） */
export const maps = [
    {
        id: '1',
        latitude: '35.681236',
        longitude: '139.767125',
        store: {
            id: '1',
            store_name: 'ラーメン二郎',
            branch_name: 'E2E東京駅前店',
            address: '東京都千代田区丸の内1-1-1',
            is_close: false
        }
    },
    {
        id: '2',
        latitude: '35.689487',
        longitude: '139.691711',
        store: {
            id: '2',
            store_name: 'ラーメン二郎',
            branch_name: 'E2E新宿店',
            address: '東京都新宿区西新宿2-8-1',
            is_close: true
        }
    }
]

/** GET /stores のレスポンス本体（`SimulationSelectStoresData[]`） */
export const stores = [
    { id: '1', store_name: 'ラーメン二郎', branch_name: 'E2E東京駅前店' },
    { id: '2', store_name: 'ラーメン二郎', branch_name: 'E2E新宿店' },
    { id: '3', store_name: 'E2E単独店', branch_name: null }
]

/**
 * GET /stores/:id/toppingCalls のレスポンス本体（`SimulationSelectToppingCallsData`）。
 *
 * `formattedToppingOptions` は `[トッピングID, オプション情報]` のタプル配列で、
 * `call_timing` に応じて中身が変わる。事前コール（pre_call）と
 * 着丼前コール（post_call）で別の内容を返し、両ページが同じ結果にならないようにしている。
 */
const preCallOptions = [
    [1, {
        toppingId: '1',
        toppingName: '麺量',
        options: [
            { optionId: '1', optionName: '少なめ', storeToppingCallId: '101' },
            { optionId: '2', optionName: '半分', storeToppingCallId: '102' }
        ]
    }],
    [2, {
        toppingId: '2',
        toppingName: '麺の硬さ',
        options: [
            { optionId: '3', optionName: 'カタメ', storeToppingCallId: '103' },
            { optionId: '4', optionName: 'ヤワメ', storeToppingCallId: '104' }
        ]
    }]
]

const postCallOptions = [
    [3, {
        toppingId: '3',
        toppingName: 'ニンニク',
        options: [
            { optionId: '5', optionName: 'ヌキ', storeToppingCallId: '105' },
            { optionId: '6', optionName: 'スクナメ', storeToppingCallId: '106' },
            { optionId: '7', optionName: 'マシ', storeToppingCallId: '107' }
        ]
    }],
    [4, {
        toppingId: '4',
        toppingName: 'ヤサイ',
        options: [
            { optionId: '8', optionName: 'スクナメ', storeToppingCallId: '108' },
            { optionId: '9', optionName: 'マシ', storeToppingCallId: '109' }
        ]
    }],
    [5, {
        toppingId: '5',
        toppingName: 'アブラ',
        options: [
            { optionId: '10', optionName: 'スクナメ', storeToppingCallId: '110' },
            { optionId: '11', optionName: 'マシ', storeToppingCallId: '111' }
        ]
    }]
]

/**
 * 店舗別トッピングコール情報を組み立てる。
 * @param {string} storeId 店舗ID
 * @param {string} callTiming 'pre_call' | 'post_call' | 'all'
 */
export function toppingCalls(storeId, callTiming) {
    const store = stores.find((s) => s.id === storeId) ?? stores[0]

    let formattedToppingOptions
    if (callTiming === 'pre_call') {
        formattedToppingOptions = preCallOptions
    } else if (callTiming === 'post_call') {
        formattedToppingOptions = postCallOptions
    } else {
        formattedToppingOptions = [...preCallOptions, ...postCallOptions]
    }

    return {
        // 実バックエンドが返すキーは `store_id` ではなく `id`。
        // かつ `Number()` 変換済みのため、ここも文字列ではなく数値で返す。
        id: Number(store.id),
        store_name: store.store_name,
        branch_name: store.branch_name,
        formattedToppingOptions
    }
}
