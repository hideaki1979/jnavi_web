import { getToppingCallOptions } from "@/app/api/toppingCalls"
import { unwrapActionResult } from "@/lib/actionResult"
import StoreForm from "@/components/Store/StoreForm"

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

