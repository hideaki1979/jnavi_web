import { getMapAll } from "@/app/api/stores";
import StoreMap from "@/components/Store/StoreMap";

/**
 * 店舗マップ画面コンポーネント
 * - 店舗情報を表示するマップを表示
 * - 現在地を取得して中心に設定
 * - マップ上に店舗情報をマーカーとして表示
 * - マーカーをクリックすると店舗情報を表示するドロワーコンポーネントを表示
 * - ドロワーコンポーネントは閉じるボタンをクリックすることで消える
 */
export default async function MapPage() {
    try {
        const mapData = await getMapAll()
        return <StoreMap mapData={mapData} />
    } catch (error) {
        console.error('MAPデータ取得失敗：', error)
        // エラーページを表示するか、空のマップを表示
        return <div>MAPデータ取得失敗しました</div>
    }
}
