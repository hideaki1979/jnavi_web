import { getToppingCallOptions } from "@/app/api/toppingCalls"
import { unwrapActionResult } from "@/lib/actionResult"
import StoreForm from "@/components/Store/StoreForm"

/**
 * ビルド時のプリレンダリングを行わず、リクエスト時にレンダリングする。
 *
 * このページはバックエンドAPIからトッピング・コールオプションを取得するため、
 * 静的生成のままだとビルドがAPIの稼働状況に依存し、
 * API側の一時的な障害でデプロイ自体が失敗してしまう。
 * また、マスタを更新しても再デプロイするまで画面に反映されない。
 */
export const dynamic = 'force-dynamic'

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

