import StoreForm from "@/components/Store/StoreForm"
import { getStoreById } from "@/app/api/stores";
import { getToppingCallOptions } from "@/app/api/toppingCalls";

interface StoreUpdatePageProps {
    params: Promise<{
        id: string;
    }>
}

/**
 * 店舗編集画面
 *
 * - 店舗情報を取得
 * 店舗編集画面 (Server Component)
 * - サーバーサイドで店舗データを取得し、クライアントコンポーネントに渡す
 *
* @returns {JSX.Element}
 */
export default async function StoreUpdatePage({ params }: StoreUpdatePageProps) {

    const { id } = await params
    // データ取得: カスタムフックuseStoreを使用
    try {
        const storeData = await getStoreById(id)
        const toppingOptions = await getToppingCallOptions()
        return <StoreForm mode="edit" initialData={storeData} toppingOptions={toppingOptions} />
    } catch (error) {
        console.error('店舗データ・トッピングデータの取得失敗:', error)
        // notFound()を呼び出すか、エラーページを表示
        throw new Error('店舗データの取得・トッピングデータ取得に失敗しました')
    }
}