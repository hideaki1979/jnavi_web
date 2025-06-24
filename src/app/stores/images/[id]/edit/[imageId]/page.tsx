import { getImageById } from '@/app/api/images'
import { getStoreToppingCalls } from '@/app/api/stores'
import { SimulationToppingOption } from '@/types/ToppingCall'
import StoreImageEditForm from '@/components/image/StoreImageEditForm'
import { Alert } from '@mui/material'

interface ImageUploadPageProps {
    params: Promise<{
        id: string;
        imageId: string;
    }>
}

/**
 * 店舗IDおよび画像IDに基づいて画像編集ページを表示する非同期サーバーコンポーネントです。
 *
 * 画像データおよびトッピングオプションを取得し、編集フォームをレンダリングします。データ取得に失敗した場合はエラーメッセージを表示します。
 */
export default async function ImageUpdatePage({ params }: ImageUploadPageProps) {
    const { id: storeId, imageId } = await params

    try {
        const [imageData, toppingCallData] = await Promise.all([
            getImageById(storeId, imageId),
            getStoreToppingCalls(storeId, 'all')
        ])
        const toppingOptions: SimulationToppingOption[] = toppingCallData.formattedToppingOptions?.map(([, opt]) => opt) ?? []
        return (
            <StoreImageEditForm
                storeId={storeId}
                imageId={imageId}
                initialImageData={imageData}
                toppingOptions={toppingOptions}
            />
        )
    } catch (error) {
        console.error("画像編集ページのデータ取得に失敗しました:", error)
        const errorMessage = error instanceof Error ? error.message : "不明なエラーが発生しました"
        return (
            <Alert severity="error" className="m-4">
                データの読み込みに失敗しました。詳細: {errorMessage}
            </Alert>
        )
    }
}