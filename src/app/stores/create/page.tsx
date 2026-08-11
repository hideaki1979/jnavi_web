import { getToppingCallOptions } from "@/app/api/toppingCalls.queries"
import { unwrapActionResult } from "@/lib/actionResult"
import StoreForm from "@/components/Store/StoreForm"
import { connection } from "next/server"

/**
 * 店舗登録ページ
 * - サーバーサイドでトッピングコール情報を取得
 * - 取得したデータをStoreFormに渡してレンダリング
 *
 * かつて `export const dynamic = 'force-dynamic'` を置いていたが、
 * Cache Components とは併用できないため `connection()` に置き換えた。
 * 元コメントが挙げていた2つの意図は次のように満たされる。
 *
 * 1. ビルドをAPIの稼働状況に依存させない
 *    → `connection()` でプリレンダリングを打ち切る。これが無いと本ページは
 *      完全静的（○ Static）としてビルド時にAPIを叩き、API停止中はビルドが失敗する。
 * 2. マスタ更新を再デプロイ無しで反映する
 *    → getToppingCallOptions() の `use cache` + cacheLife("days") が担当する。
 *
 * `force-dynamic` と違い loading.tsx のシェルはビルド時にプリレンダリングされるため、
 * 遷移直後にスケルトンが即表示される（◐ Partial Prerender）。
 *
 * @returns JSX.Element
 */

export default async function CreateStorePage() {
    // ここでプリレンダリングを打ち切る。以降はリクエスト時にのみ実行される。
    await connection()
    const toppingOptions = unwrapActionResult(await getToppingCallOptions())
    return <StoreForm mode="create" toppingOptions={toppingOptions} />
}

