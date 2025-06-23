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
    let toppingOptions: SimulationToppingOption[] = []
    try {

        const toppingCallData = await getStoreToppingCalls(id, "all")

        toppingOptions
            = toppingCallData?.formattedToppingOptions?.map(([, opt]) => opt) ?? []
    } catch (error) {
        console.error('トッピング情報の取得失敗：', error)
        // エラーページへリダイレクトまたはエラーUIを表示
        throw new Error('トッピング情報の取得に失敗しました')
    }
    return <StoreImageUploadForm storeId={id} toppingOptions={toppingOptions} />

}