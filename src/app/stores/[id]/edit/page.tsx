import StoreForm from "@/components/Store/StoreForm"
import { getStoreById } from "@/app/api/stores.queries";
import { getToppingCallOptions } from "@/app/api/toppingCalls.queries";
import { unwrapActionResult } from "@/lib/actionResult";

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
    const [storeResult, toppingOptionsResult] = await Promise.all([
        getStoreById(storeId),
        getToppingCallOptions()
    ])
    const storeData = unwrapActionResult(storeResult)
    const toppingOptions = unwrapActionResult(toppingOptionsResult)
    return <StoreForm mode="edit" initialData={storeData} toppingOptions={toppingOptions} />
}