import { getToppingCallOptions } from "@/app/api/toppingCalls.queries"
import { unwrapActionResult } from "@/lib/actionResult"
import StoreForm from "@/components/Store/StoreForm"

/*
 * かつて `export const dynamic = 'force-dynamic'` を置いていたが、
 * Cache Components とは併用できないため削除した。
 * 元の意図（ビルドをAPIの稼働状況に依存させない／マスタ更新を再デプロイ無しで反映する）は
 * Cache Components 側で満たされる。ページは既定で dynamic であり、
 * データ取得は getToppingCallOptions() の `use cache` が担当する。
 */

/**
 * 店舗登録ページ
 * - サーバーサイドでトッピングコール情報を取得
 * - 取得したデータをStoreFormに渡してレンダリング
 *
 * @returns JSX.Element
 */

export default async function CreateStorePage() {
    const toppingOptions = unwrapActionResult(await getToppingCallOptions())
    return <StoreForm mode="create" toppingOptions={toppingOptions} />
}

