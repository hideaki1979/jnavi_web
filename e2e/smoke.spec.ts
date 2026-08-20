/**
 * 主要ページのスモークテスト。
 *
 * E2Eの網羅ではなく「主要ページが開いて、コンソールにエラーが出ない」ことの担保が目的。
 * Next.js / React / MUI のような描画の根幹に関わる依存を更新したときに、
 * ビルドと型チェックが通っても実行時に壊れていないかを機械的に確かめる。
 *
 * dev（Turbopack）と本番ビルド（next build + next start）は別実装なので、
 * 両構成で回すこと。片方だけでは不十分（`npm run test:e2e` が両方を順に実行する）。
 */
import { expect, test } from '@playwright/test'

import { classifyRecords, collectConsoleRecords, formatRecords } from './console-guard'
import { SMOKE_ROUTES } from './routes'

/**
 * `load` 完了後に hydration が走り切るのを待つ時間。
 *
 * hydration は load 後に実行されるため、`waitUntil: 'load'` の直後に判定すると
 * 不一致を取りこぼす（#66 の検証で実際に踏んだ）。
 */
const HYDRATION_SETTLE_MS = 3_000

const mode = process.env.E2E_MODE === 'prod' ? '本番ビルド' : 'dev'

test.describe(`スモークテスト（${mode}）`, () => {
    for (const route of SMOKE_ROUTES) {
        test(`${route.name}: ${route.path}`, async ({ page }, testInfo) => {
            // goto より前に張ること。張る前に出た分は記録されない
            const records = collectConsoleRecords(page)

            const response = await page.goto(route.path, { waitUntil: 'load' })

            // hydration の完了を待ってから判定する
            await page.waitForTimeout(HYDRATION_SETTLE_MS)

            // MUI と Tailwind のカスケードレイヤー順が崩れていないかの目視確認用。
            // 判定には使わないが、レポートに残しておくと更新時の比較が早い
            await testInfo.attach(`${route.name}.png`, {
                body: await page.screenshot({ fullPage: true }),
                contentType: 'image/png'
            })

            // レスポンス自体が失敗していないこと。
            // コンソール判定だけだと、真っ白なエラーページでも通ってしまう
            expect(response, `${route.path} のレスポンスを取得できませんでした`).not.toBeNull()
            expect(
                response!.status(),
                `${route.path} が HTTP ${response!.status()} を返しました`
            ).toBeLessThan(400)

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
                `hydration 不一致を検出しました（${route.path}）:\n${formatRecords(hydration)}\n${readInDevHint}`
            ).toHaveLength(0)

            expect(
                failures,
                `コンソールにエラー／警告が出ました（${route.path}）:\n${formatRecords(failures)}\n${readInDevHint}`
            ).toHaveLength(0)
        })
    }
})
