import { getMapAll } from "@/app/api/stores.queries";
import { unwrapActionResult } from "@/lib/actionResult";
import StoreMapClient from "@/components/Store/StoreMapClient";

/*
 * かつて `export const dynamic = 'force-dynamic'` を置いていたが、
 * Cache Components とは併用できないため削除した。
 * 元の意図（ビルドをAPIの稼働状況に依存させない／登録・更新を再デプロイ無しで反映する）は
 * Cache Components 側で満たされる。ページは既定で dynamic であり、
 * データ取得は getMapAll() の `use cache` が担当する。
 * 反映は updateTag('stores')（自アプリからの更新）と cacheLife('hours')（外部からの更新）による。
 */

/**
 * 店舗マップ画面コンポーネント
 * - 店舗情報を表示するマップを表示
 * - 現在地を取得して中心に設定
 * - マップ上に店舗情報をマーカーとして表示
 * - マーカーをクリックすると店舗情報を表示するドロワーコンポーネントを表示
 * - ドロワーコンポーネントは閉じるボタンをクリックすることで消える
 */
export default async function MapPage() {
    const mapData = unwrapActionResult(await getMapAll())
    return <StoreMapClient mapData={mapData} />
}
