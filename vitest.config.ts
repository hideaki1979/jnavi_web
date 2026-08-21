/**
 * 単体テスト（Vitest）の実行設定。
 *
 * ## 対象
 *
 * `src/**` に置いた `*.test.ts` を実行する。テスト対象のファイルの隣に置く。
 * `e2e/` は Playwright（playwright.config.ts）の担当なので含めない。
 * 拡張子を `.spec.ts` にすると Playwright 側の既定の命名と紛らわしいため
 * `.test.ts` に寄せている。
 *
 * ## 環境
 *
 * 現状の対象は Route Handler・proxy・純粋な関数だけで、DOM に触らないので
 * `node` 環境で回す。コンポーネントのテストを足すときは `jsdom` が要るが、
 * 使わないうちから jsdom や Testing Library を入れても無駄なので、
 * そのとき `test.projects` で環境ごとに分ける（#81）。
 */
import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
    test: {
        environment: 'node',
        include: ['src/**/*.test.ts'],
        // CI では `.only` の消し忘れを失敗として扱う（Playwright 側の forbidOnly と同じ方針）
        allowOnly: !process.env.CI,
        // グローバルは持ち込まず、各テストで vitest から import する
        globals: false,
        // テストごとに呼び出し履歴を消す（vi.fn() を含む全モックが対象）
        clearMocks: true,
        // テストごとに vi.spyOn を元の実装へ戻す。
        // console.error の握り潰しを張りっぱなしにしないため
        restoreMocks: true
    },
    resolve: {
        alias: {
            // tsconfig.json の paths と同じ対応。
            // vite-tsconfig-paths を足すほどの規模ではないので直接書く
            '@': fileURLToPath(new URL('./src', import.meta.url)),

            // `server-only` は Next.js がビルド時にエイリアスしているだけで、
            // node_modules に実体が無い（依存にも入っていない）。
            // そのまま解決させると `src/lib/server/firebaseAdmin.ts` の
            // `import 'server-only'` で落ちるため、Next.js 自身がサーバービルドで
            // 使っているのと同じ空モジュール（react-server 条件の解決先）へ向ける。
            'server-only': fileURLToPath(
                new URL('./node_modules/next/dist/compiled/server-only/empty.js', import.meta.url)
            )
        }
    }
})
