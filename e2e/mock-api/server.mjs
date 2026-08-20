/**
 * スモークテスト用のスタブバックエンドAPI。
 *
 * ## なぜ Playwright の `page.route()` ではなくサーバーを立てるのか
 *
 * このアプリはバックエンドAPIをブラウザから直接叩かない。
 * 読み取りはサーバーコンポーネント（`src/app/api/*.queries.ts` の `"use cache"` 関数）、
 * 書き込みは Server Action（`src/app/api/*.ts`）が axios で呼んでおり、
 * 通信は「Next.js サーバー → バックエンド」の Node 間で完結する。
 * ブラウザが出すのは Next.js 自身へのリクエストだけなので、
 * ブラウザ側で網を張る `page.route()` ではこの通信を捕まえられない。
 *
 * そこでスタブを別プロセスで立て、Next.js サーバーの
 * `NEXT_PUBLIC_API_URL` をそこへ向ける（playwright.config.ts 参照）。
 * docker-compose で実バックエンドを立てるより軽く、
 * `/` と `/stores/map` を含む全ルートを対象にできる。
 *
 * ## 対応エンドポイント
 *
 * 対象ルートから実際に到達するものだけを実装している。
 * 未実装のパスはバックエンドのエラー形（`{ success: false, error }`）で404を返すため、
 * 想定外の呼び出しがあればテスト側のコンソールエラーとして表面化する。
 *
 * 起動: `node e2e/mock-api/server.mjs`（ポートは E2E_MOCK_API_PORT、既定 3300）
 */
import { createServer } from 'node:http'

import { maps, stores, toppingCalls } from './fixtures.mjs'

const port = Number(process.env.E2E_MOCK_API_PORT ?? 3300)
const host = '127.0.0.1'

/**
 * 成功エンベロープ（`ApiEnvelope<T>`）でJSONを返す。
 * @param {import('node:http').ServerResponse} res
 * @param {unknown} data レスポンス本体
 * @param {string} message 処理結果メッセージ
 */
function sendData(res, data, message) {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
    res.end(JSON.stringify({ success: true, message, data }))
}

/**
 * エラーエンベロープ（errorMiddleware 由来の形）でJSONを返す。
 * @param {import('node:http').ServerResponse} res
 * @param {number} status HTTPステータス
 * @param {string} error エラーメッセージ
 */
function sendError(res, status, error) {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' })
    res.end(JSON.stringify({ success: false, error }))
}

const server = createServer((req, res) => {
    const url = new URL(req.url ?? '/', `http://${host}:${port}`)
    const path = url.pathname

    // Playwright の webServer が起動完了を判定するためのエンドポイント
    if (path === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
        res.end(JSON.stringify({ status: 'ok' }))
        return
    }

    if (req.method !== 'GET') {
        // 書き込み系は保護ルート専用で、スモークテストの対象外。
        // 呼ばれたこと自体が想定外なので、素通りさせずエラーにする。
        sendError(res, 405, `スタブAPIは ${req.method} を実装していません：${path}`)
        return
    }

    if (path === '/maps') {
        sendData(res, maps, 'MAP情報取得に成功しました。')
        return
    }

    if (path === '/stores') {
        sendData(res, stores, '店舗情報取得に成功しました。')
        return
    }

    const toppingCallsMatch = path.match(/^\/stores\/([^/]+)\/toppingCalls$/)
    if (toppingCallsMatch) {
        const storeId = decodeURIComponent(toppingCallsMatch[1])
        const callTiming = url.searchParams.get('call_timing') ?? 'all'
        sendData(
            res,
            toppingCalls(storeId, callTiming),
            '店舗別トッピングコール情報取得に成功しました。'
        )
        return
    }

    sendError(res, 404, `スタブAPIは ${path} を実装していません。`)
})

server.listen(port, host, () => {
    console.log(`[mock-api] listening on http://${host}:${port}`)
})
