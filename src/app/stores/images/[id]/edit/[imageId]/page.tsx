import { getImageById } from '@/app/api/images'
import { getStoreToppingCalls } from '@/app/api/stores'
import { SimulationToppingOption } from '@/types/ToppingCall'
import StoreImageEditForm from '@/components/image/StoreImageEditForm'

interface ImageUploadPageProps {
    params: Promise<{
        id: string;
        imageId: string;
    }>
}

/**
 * 画像編集画面
 * - 店舗IDと画像IDを取得して画像の編集を行う
 */
export default async function ImageUpdatePage({ params }: ImageUploadPageProps) {
    const { id: storeId, imageId } = await params

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
}