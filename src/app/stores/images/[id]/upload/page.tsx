import { getStoreToppingCalls } from "@/app/api/stores"
import { SimulationToppingOption } from "@/types/ToppingCall"
import StoreImageUploadForm from "@/components/image/StoreImageUploadForm"

interface StoreImageUploadPageProps {
    params: Promise<{
        id: string;
    }>
}

/**
 * 画像アップロード画面
 * @param id 店舗ID
 * @returns 画像アップロード画面
 */
export default async function StoreImageUploadPage({ params }: StoreImageUploadPageProps) {
    const { id } = await params

    // トッピング情報を取得
    const toppingCallData = await getStoreToppingCalls(id, "all")

    const toppingOptions: SimulationToppingOption[]
        = toppingCallData?.formattedToppingOptions?.map(([, opt]) => opt) ?? []
    return <StoreImageUploadForm storeId={id} toppingOptions={toppingOptions} />

}