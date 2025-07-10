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

    const { id: storeId } = await params
    // データ取得: カスタムフックuseStoreを使用
    const [storeData, toppingOptions] = await Promise.all([
        getStoreById(storeId),
        getToppingCallOptions()
    ])
    return <StoreForm mode="edit" initialData={storeData} toppingOptions={toppingOptions} />
}