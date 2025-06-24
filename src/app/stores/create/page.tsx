import { getToppingCallOptions } from "@/app/api/toppingCalls"
import StoreForm from "@/components/Store/StoreForm"

/**
 * 店舗登録画面コンポーネント
 *
 * - トッピングコール情報を取得し、店舗情報を登録するフォームを提供
 * - 事前トッピングコールと着丼前トッピングコールの選択を管理
 * - フォーム送信で店舗情報を登録し、成功メッセージまたはエラーメッセージを表示
 *
 * @returns JSX.Element
 */

export default async function CreateStorePage() {
    try {
        const toppingOptions = await getToppingCallOptions()
        return <StoreForm mode="create" toppingOptions={toppingOptions} />
    } catch (error) {
        console.error('トッピングデータの取得失敗:', error)
        // notFound()を呼び出すか、エラーページを表示
        throw new Error('トッピングデータ取得に失敗しました')

    }
}

