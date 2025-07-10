import { getToppingCallOptions } from "@/app/api/toppingCalls"
import StoreForm from "@/components/Store/StoreForm"

/**
 * 店舗登録ページ
 * - サーバーサイドでトッピングコール情報を取得
 * - 取得したデータをStoreFormに渡してレンダリング
 *
 * @returns JSX.Element
 */

export default async function CreateStorePage() {
    const toppingOptions = await getToppingCallOptions()
    return <StoreForm mode="create" toppingOptions={toppingOptions} />
}

