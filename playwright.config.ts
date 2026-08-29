/**
 * スモークテスト（e2e/smoke.spec.ts）の実行設定。
 *
 * ## 前提：バックエンドAPIを起動しておくこと
 *
 * 既定では実バックエンド（`Tech_Val/nodedeploytest`、`:3000`）に向けて実行する。
 * `.env` の `NEXT_PUBLIC_API_URL` がそのまま使われるので、ここでは上書きしない。
 * 実データが実際に描画できるところまで確かめたいので、これを既定にしている。
 *
 * バックエンドが起動していない場合はテスト開始前に落ちる（e2e/require-backend.mjs）。
 * PostgreSQL は nodedeploytest の docker-compose（`localhost:5433`）が要るので、
 * Docker が落ちているとAPIは 500 を返す点にも注意。
 *
 * バックエンドを使わずに回したいときは `E2E_USE_MOCK_API=1` を付けると
 * スタブAPI（e2e/mock-api/server.mjs）に切り替わる。
 * 依存が Node だけになるので、将来 CI に載せるならこちらを使う。
 *
 * ```bash
 * npm run test:e2e                        # 実バックエンド
 * E2E_USE_MOCK_API=1 npm run test:e2e     # スタブAPI
 * ```
 *
 * ## 構成
 *
 * `E2E_MODE` で Next.js サーバーの構成を切り替える。
 * dev（Turbopack）と本番ビルドは別実装なので、両方で回すこと。
 */
import { defineConfig, devices } from '@playwright/test'
import { loadEnvConfig } from '@next/env'

/** 'prod' なら `next build` + `next start`、それ以外は `next dev`（Turbopack） */
const isProd = process.env.E2E_MODE === 'prod'

/** バックエンドの代わりにスタブAPIを使うか */
const useMockApi = process.env.E2E_USE_MOCK_API === '1'

/**
 * アプリと同じ方法で `.env` を読み込む。
 *
 * バックエンドの疎通確認（require-backend.mjs）と店舗IDの取得（global-setup.ts）に
 * `NEXT_PUBLIC_API_URL` が要るが、Playwright は `.env` を自動では読まない。
 * ここで別の既定値を書くと `.env` と二重管理になり、
 * 「アプリが見ているURL」と「疎通確認したURL」がずれて原因が分からなくなるため、
 * Next.js 自身と同じローダー（`@next/env`）で同じ値を読む。
 *
 * 既に `process.env` にある値は上書きされないので、
 * シェルで `NEXT_PUBLIC_API_URL=... npm run test:e2e:dev` と渡せばそちらが優先される。
 */
loadEnvConfig(process.cwd(), !isProd, { info: () => {}, error: console.error })

/**
 * ポートは既定の3000を避けている。
 * :3000 はバックエンドが占有しているうえ、開発サーバーと相乗りすると
 * テストが何を見ているのか分からなくなるため。
 */
const appPort = Number(process.env.E2E_APP_PORT ?? (isProd ? 3200 : 3100))
const mockApiPort = Number(process.env.E2E_MOCK_API_PORT ?? 3300)

/**
 * アプリ側は `127.0.0.1` ではなく `localhost` で開く。
 * `next dev` は起動時のホスト名（既定で localhost）以外からの `/_next/*` への
 * リクエストをクロスオリジンとして 403 で弾くため、`127.0.0.1` で開くと
 * チャンクの取得と HMR の WebSocket が軒並み失敗する（Next.js の allowedDevOrigins）。
 */
const baseURL = `http://localhost:${appPort}`

/** スタブAPIの待ち受け先。Node 間通信なので `localhost` の名前解決に依存させない */
const mockApiURL = `http://127.0.0.1:${mockApiPort}`

/**
 * アプリが実際に叩くAPIのURL。
 * スタブ利用時のみ上書きし、それ以外は `.env` の値をそのまま使う。
 */
const apiURL = useMockApi ? mockApiURL : (process.env.NEXT_PUBLIC_API_URL ?? '')

if (!apiURL) {
    throw new Error(
        'NEXT_PUBLIC_API_URL が解決できません。`.env` に設定するか、' +
        'バックエンド無しで回すなら E2E_USE_MOCK_API=1 を付けてください。'
    )
}

/**
 * APIサーバーを待つ webServer 定義。
 *
 * スタブ利用時はスタブを起動する。
 * 実バックエンド利用時は「起動していなければ案内を出して落ちる」だけのコマンドを置く。
 * `reuseExistingServer` により、起動済みなら `url` の応答を見てコマンドは実行されない。
 */
const apiWebServer: { command: string; url: string; env: Record<string, string> } = useMockApi
    ? {
        command: 'node e2e/mock-api/server.mjs',
        url: `${mockApiURL}/health`,
        env: { E2E_MOCK_API_PORT: String(mockApiPort) }
    }
    : {
        command: `node e2e/require-backend.mjs ${apiURL}`,
        url: `${apiURL}/health`,
        env: {}
    }

export default defineConfig({
    testDir: './e2e',
    globalSetup: './e2e/global-setup.ts',
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
        // 許可と座標を固定して、実行環境によって結果が変わらないようにする。
        //
        // ここの座標は既定値で、実行時は e2e/smoke.spec.ts が
        // `GET /maps` の先頭の店舗の座標で上書きする。
        // 東京駅のままだと店舗が遠い環境ではピンがビューポートの外に出てしまい、
        // 「ピンが見えていること」を目印にできないため（e2e/routes.ts の MAP_MARKER）
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
            ...apiWebServer,
            reuseExistingServer: true,
            stdout: 'pipe',
            stderr: 'pipe'
        },
        {
            command: isProd
                ? `npm run build && npm run start -- --port ${appPort}`
                : `npm run dev -- --port ${appPort}`,
            // バックエンドAPIに依存しない公開ルートで起動完了を判定する
            url: `${baseURL}/auth/login`,
            // スタブ利用時だけAPIの向き先を差し替える。
            // `NEXT_PUBLIC_*` はビルド時にバンドルへ埋め込まれるため、
            // 本番構成では `next build` にも同じ環境変数が渡る必要がある
            // （`webServer.command` に `npm run build` を含めているのはそのため）。
            env: useMockApi ? { NEXT_PUBLIC_API_URL: mockApiURL } : {},
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
