/**
 * スモークテスト（e2e/smoke.spec.ts）の実行設定。
 *
 * ## 構成
 *
 * Playwright が2つのサーバーを起動する。
 *
 * 1. スタブバックエンドAPI（`e2e/mock-api/server.mjs`）
 * 2. Next.js サーバー。`E2E_MODE` で dev（Turbopack）と本番ビルドを切り替える
 *
 * ## なぜ NEXT_PUBLIC_API_URL を上書きするのか
 *
 * ローカルの `.env` は `NEXT_PUBLIC_API_URL=http://localhost:3000` で、
 * これは Next.js アプリ自身のポートを指している。そのままではバックエンドAPIを
 * 叩くページ（`/`・`/stores/map`）で `GET /maps` が404になり `pageerror` が出る。
 * ここでスタブAPIのURLを渡してその状態を避ける。
 *
 * `webServer.env` は子プロセスの `process.env` に載り、Next.js の `.env` ローダーは
 * すでに `process.env` にある値を上書きしない。したがって
 * `NEXT_PUBLIC_API_URL` だけがスタブに向き、Firebase や Google Maps の鍵は
 * 開発者の `.env` がそのまま使われる（`.env` が無い環境では未設定のまま動く）。
 *
 * なお `NEXT_PUBLIC_*` はビルド時にバンドルへ埋め込まれるため、
 * 本番ビルド構成では `next build` にもこの環境変数を渡す必要がある。
 * `webServer.command` に `npm run build` を含めているのはそのため。
 */
import { defineConfig, devices } from '@playwright/test'

/** 'prod' なら `next build` + `next start`、それ以外は `next dev`（Turbopack） */
const isProd = process.env.E2E_MODE === 'prod'

/**
 * ポートは既定の3000を避けている。
 * ローカルではバックエンドや開発サーバーが3000を使っていることがあり、
 * そこへ相乗りするとテストが何を見ているのか分からなくなるため。
 */
const appPort = Number(process.env.E2E_APP_PORT ?? (isProd ? 3200 : 3100))
const mockApiPort = Number(process.env.E2E_MOCK_API_PORT ?? 3300)

/**
 * アプリ側は `127.0.0.1` ではなく `localhost` で開く。
 * `next dev` は起動時のホスト名（既定で localhost）以外からの `/_next/*` への
 * リクエストをクロスオリジンとして 403 で弾くため、`127.0.0.1` で開くと
 * チャンクの取得と HMR の WebSocket が軒並み失敗する（Next.js の allowedDevOrigins）。
 *
 * 一方スタブAPIは Node 間通信なのでその制約と無関係。
 * `localhost` が IPv6（::1）に解決される環境で取りこぼさないよう、
 * 待ち受けと同じ `127.0.0.1` をそのまま使う。
 */
const baseURL = `http://localhost:${appPort}`
const mockApiURL = `http://127.0.0.1:${mockApiPort}`

export default defineConfig({
    testDir: './e2e',
    // スモークテストは互いに独立しているので並列で構わない
    fullyParallel: true,
    // CI では `test.only` の消し忘れをビルド失敗として扱う
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    // list は実行中の進捗、html は失敗時のスクリーンショットとトレースの確認用
    // （`npm run test:e2e:report` で開く）。実行のたびに勝手に開かないよう open は never
    reporter: [['list'], ['html', { open: 'never' }]],

    use: {
        baseURL,
        // hydration の待ち（3秒）を含めても収まる長さ
        actionTimeout: 15_000,
        navigationTimeout: 30_000,
        trace: 'retain-on-failure',

        // `/stores/map` は `navigator.geolocation.getCurrentPosition` を呼び、
        // 失敗すると `console.error('現在地情報取得エラー：', ...)` を出す。
        // 許可と座標を固定して、実行環境によって結果が変わらないようにする
        permissions: ['geolocation'],
        geolocation: { latitude: 35.681236, longitude: 139.767125 }, // 東京駅
        locale: 'ja-JP',
        timezoneId: 'Asia/Tokyo'
    },

    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } }
        }
    ],

    webServer: [
        {
            command: 'node e2e/mock-api/server.mjs',
            url: `${mockApiURL}/health`,
            env: { E2E_MOCK_API_PORT: String(mockApiPort) },
            reuseExistingServer: !process.env.CI,
            stdout: 'pipe',
            stderr: 'pipe'
        },
        {
            command: isProd
                ? `npm run build && npm run start -- --port ${appPort}`
                : `npm run dev -- --port ${appPort}`,
            // バックエンドAPIに依存しない公開ルートで起動完了を判定する
            url: `${baseURL}/auth/login`,
            env: { NEXT_PUBLIC_API_URL: mockApiURL },
            // 本番構成では既存サーバーを再利用しない。
            // 再利用すると `npm run build` ごと省略され、古いビルドを検証してしまう
            // （変更を入れたのにテストが通る、という取りこぼしになる）。
            // ポートが塞がっていればテストは起動時に失敗するので、気づける。
            // dev はソースの変更を拾い直すため再利用してよい。
            reuseExistingServer: isProd ? false : !process.env.CI,
            // 本番構成は `next build` の時間を含むため長めに取る
            timeout: isProd ? 600_000 : 180_000,
            stdout: 'pipe',
            stderr: 'pipe'
        }
    ]
})
