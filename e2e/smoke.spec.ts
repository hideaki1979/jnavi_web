/**
 * 主要ページのスモークテスト。
 *
 * E2Eの網羅ではなく「主要ページが開いて、中身が描かれていて、
 * コンソールにエラーが出ない」ことの担保が目的。
 * Next.js / React / MUI のような描画の根幹に関わる依存を更新したときに、
 * ビルドと型チェックが通っても実行時に壊れていないかを機械的に確かめる。
 *
 * 中身まで見るのは、データの取得経路が壊れて画面が空になる退行が、
 * まさにビルドと型チェックをすり抜ける壊れ方だから（#101）。
 * 何をもって「描かれている」とするかは e2e/routes.ts の `expectedContent`。
 *
 * dev（Turbopack）と本番ビルド（next build + next start）は別実装なので、
 * 両構成で回すこと。片方だけでは不十分（`npm run test:e2e` が両方を順に実行する）。
 */
import { expect, test } from '@playwright/test'

import { classifyRecords, collectConsoleRecords, formatRecords } from './console-guard'
import { SMOKE_ROUTES, STORE_ID_PLACEHOLDER } from './routes'

/**
 * `load` 完了後に hydration が走り切るのを待つ時間。
 *
 * hydration は load 後に実行されるため、`waitUntil: 'load'` の直後に判定すると
 * 不一致を取りこぼす（#66 の検証で実際に踏んだ）。
 */
const HYDRATION_SETTLE_MS = 3_000

/**
 * 目印が現れるのを待つ上限。
 *
 * hydration の待ち時間を挟んだ後に判定するが、Google Maps の読み込みのように
 * そこからさらに時間の掛かるものがあるため、`expect` の既定（5秒）より長く取る。
 */
const CONTENT_TIMEOUT_MS = 15_000

const mode = process.env.E2E_MODE === 'prod' ? '本番ビルド' : 'dev'

/**
 * `route.path` は相対パスなので、`new URL()` でパス名を取り出すための基準。
 * 比較に使うのはパス名だけなので、実際の baseURL と一致している必要はない。
 */
const baseOrigin = 'http://localhost'

/**
 * `route.path` の目印を、global-setup が取得した実在の店舗IDへ差し替える。
 *
 * 参照をここまで遅らせているのは、routes.ts がテスト一覧の作成時にも読み込まれ、
 * その時点ではまだ `E2E_STORE_ID` が入っていないため
 * （globalSetup は一覧の作成より後に走る）。
 * モジュールの読み込み時に読むと `npx playwright test --list` や
 * エディタのテスト一覧が「テスト0件」になる。
 */
function resolveStoreId(path: string): string {
    if (!path.includes(STORE_ID_PLACEHOLDER)) return path

    const storeId = process.env.E2E_STORE_ID
    if (!storeId) {
        throw new Error(
            'E2E_STORE_ID が未設定です。e2e/global-setup.ts が実行されていない可能性があります。'
        )
    }

    return path.replaceAll(STORE_ID_PLACEHOLDER, storeId)
}

/**
 * マップを開くときの現在地。global-setup が `GET /maps` から取った実在店舗の座標。
 *
 * `playwright.config.ts` の既定（東京駅）のまま開くと、店舗がそこから遠い環境では
 * ピンがビューポートの外に出る。Google Maps は視界の外のマーカーを非表示側の
 * スロットへ移すため、DOMには在るのに hidden として扱われ、
 * 正しく描けているのに目印が見つからない（実測）。
 *
 * 現在地を店舗に寄せておけば「近くの店舗がピンとして見えている」という
 * 利用者から見た状態をそのまま検証できる。座標はAPIから取るので、
 * DBの中身が変わっても、モックAPIに切り替えても成立する。
 */
function resolveMapGeolocation(): { latitude: number; longitude: number } {
    const rawLatitude = process.env.E2E_MAP_LATITUDE
    const rawLongitude = process.env.E2E_MAP_LONGITUDE

    // 空文字を `Number()` に渡すと 0 になり、緯度経度として成立してしまうので先に弾く
    if (!rawLatitude || !rawLongitude) {
        throw new Error(
            'E2E_MAP_LATITUDE / E2E_MAP_LONGITUDE が未設定です。' +
            'e2e/global-setup.ts が実行されていない可能性があります。'
        )
    }

    return { latitude: Number(rawLatitude), longitude: Number(rawLongitude) }
}

test.describe(`スモークテスト（${mode}）`, () => {
    for (const route of SMOKE_ROUTES) {
        test(`${route.name}: ${route.path}`, async ({ page }, testInfo) => {
            // テスト名には目印のまま残し、実際に開くURLだけ差し替える。
            // 名前が環境のDBの中身で変わると `-g` での絞り込みや履歴比較が効かなくなる
            const path = resolveStoreId(route.path)

            // 現在地を読むのはマップだけだが、ルートで分けるほどのものではないので一律に設定する
            await page.context().setGeolocation(resolveMapGeolocation())

            // goto より前に張ること。張る前に出た分は記録されない
            const records = collectConsoleRecords(page)

            const response = await page.goto(path, { waitUntil: 'load' })

            // hydration の完了を待ってから判定する
            await page.waitForTimeout(HYDRATION_SETTLE_MS)

            // MUI と Tailwind のカスケードレイヤー順が崩れていないかの目視確認用。
            // 判定には使わないが、レポートに残しておくと更新時の比較が早い
            await testInfo.attach(`${route.name}.png`, {
                body: await page.screenshot({ fullPage: true }),
                contentType: 'image/png'
            })

            // レスポンス自体が失敗していないこと。
            // コンソール判定だけだと、真っ白なエラーページでも通ってしまう。
            //
            // ここで見ているのはドキュメント（リダイレクト後の最終応答）だけだが、
            // チャンク・CSS・フォント・同一オリジンの fetch や Server Action が
            // 4xx/5xx を返した場合は、Chromium が
            // `Failed to load resource: the server responded with a status of NNN` を
            // コンソールに出し、それを collectConsoleRecords が拾って失敗にする。
            // dev・本番ビルドの両方で、JSチャンク404・CSS404・フォント404・
            // Server Action の500 を仕込んで、いずれも失敗することを確認済み。
            // そのため page.on('response') による二重チェックは置いていない。
            //
            // ただしこれは Chromium が失敗した読み込みをコンソールに出す挙動に依存している。
            // `projects` に他のブラウザを足すときは、同じ取りこぼしが起きないか確かめること。
            expect(response, `${path} のレスポンスを取得できませんでした`).not.toBeNull()
            expect(
                response!.status(),
                `${path} が HTTP ${response!.status()} を返しました`
            ).toBeLessThan(400)

            // 着地先が想定どおりであること。
            // `page.goto()` はリダイレクトを追跡するため、別のページへ飛ばされていても
            // ステータスは 200 になる。保護ルート化などで `/auth/login` に着地すると、
            // そのページ自体は正常に開くのでコンソール判定も素通りしてしまう。
            // hydration の待ち時間を挟んだ後に見ているので、遷移後のクライアント側の
            // リダイレクトも対象に入る
            const expectedPathname =
                route.expectedPathname ?? new URL(path, baseOrigin).pathname
            expect(
                new URL(page.url()).pathname,
                `${path} を開いたつもりが ${page.url()} に着地しました。` +
                'リダイレクトが増えていないか（src/proxy.ts の matcher など）確認してください'
            ).toBe(expectedPathname)

            // 中身が描かれていること。
            // ここまでの判定は「開いて、着地して」しか見ていないため、
            // データの取得経路が壊れて中身が空になった状態は素通りする（#101）。
            // 例えば `GET /maps` が `{ data: [] }` を返しても、HTTPは200、着地先も同じ、
            // サーバーコンポーネントは例外を投げず、コンソールにも何も出ない。
            //
            // コンソールの判定より前に置いているのは、目印を出すための操作
            // （`revealedBy`）が出したエラーも取りこぼさないため。
            // records は収集を続けているので、この後の分類にその分も入る。
            const { locator, description, revealedBy } = route.expectedContent

            if (revealedBy) {
                await page.locator(revealedBy).first().click()
            }

            await expect(
                page.locator(locator).first(),
                `${path} に「${description}」が見つかりません（セレクタ: ${locator}）。` +
                'ページ自体は開いているので、データの取得経路か描画のどちらかが' +
                '壊れている可能性があります'
            ).toBeVisible({ timeout: CONTENT_TIMEOUT_MS })

            const { hydration, failures, ignored } = classifyRecords(records, route.name)

            if (ignored.length > 0) {
                // 許容したものは黙って捨てず、理由つきでレポートに残す
                await testInfo.attach(`${route.name}-ignored.txt`, {
                    body: ignored
                        .map(({ record, reason }) => `[${record.type}] ${record.text}\n  → 許容理由: ${reason}`)
                        .join('\n\n'),
                    contentType: 'text/plain'
                })
            }

            // 本番ビルドではメッセージが `Minified React error #NNN` に置き換わり内容が読めない。
            // その場合は dev 構成で同じルートを開くと実メッセージが読めるので、
            // どちらの失敗メッセージにも案内を添えておく
            const readInDevHint =
                '本番ビルドで `Minified React error #NNN` としか出ない場合は、' +
                '`npm run test:e2e:dev` で同じルートを開くと実メッセージが読めます。'

            expect(
                hydration,
                `hydration 不一致を検出しました（${path}）:\n${formatRecords(hydration)}\n${readInDevHint}`
            ).toHaveLength(0)

            expect(
                failures,
                `コンソールにエラー／警告が出ました（${path}）:\n${formatRecords(failures)}\n${readInDevHint}`
            ).toHaveLength(0)
        })
    }
})
