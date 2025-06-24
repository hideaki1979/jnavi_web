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
    try {
        return <StoreForm mode="create" toppingOptions={toppingOptions} />
    } catch (error) {
        console.error('トッピングデータの取得失敗:', error)
        // notFound()を呼び出すか、エラーページを表示
        throw new Error('トッピングデータ取得に失敗しました')
    }
}

