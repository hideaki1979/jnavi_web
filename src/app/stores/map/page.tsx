import { getMapAll } from "@/app/api/stores.queries";
import { unwrapActionResult } from "@/lib/actionResult";
import StoreMapClient from "@/components/Store/StoreMapClient";
import { connection } from "next/server";

/**
 * 店舗マップ画面コンポーネント
 * - 店舗情報を表示するマップを表示
 * - 現在地を取得して中心に設定
 * - マップ上に店舗情報をマーカーとして表示
 * - マーカーをクリックすると店舗情報を表示するドロワーコンポーネントを表示
 * - ドロワーコンポーネントは閉じるボタンをクリックすることで消える
 *
 * かつて `export const dynamic = 'force-dynamic'` を置いていたが、
 * Cache Components とは併用できないため `connection()` に置き換えた。
 * 元コメントが挙げていた2つの意図は次のように満たされる。
 *
 * 1. ビルドをAPIの稼働状況に依存させない
 *    → `connection()` でプリレンダリングを打ち切る。これが無いと本ページは
 *      完全静的（○ Static）としてビルド時にAPIを叩き、API停止中はビルドが失敗する。
 * 2. 店舗の登録・更新を再デプロイ無しで反映する
 *    → updateTag('stores')（自アプリからの更新）と
 *      cacheLife('hours')（モバイルアプリ等からの更新）が担当する。
 *
 * `force-dynamic` と違い loading.tsx のシェルはビルド時にプリレンダリングされるため、
 * 遷移直後にスケルトンが即表示される（◐ Partial Prerender）。
 */
export default async function MapPage() {
    // ここでプリレンダリングを打ち切る。以降はリクエスト時にのみ実行される。
    await connection()
    const mapData = unwrapActionResult(await getMapAll())
    return <StoreMapClient mapData={mapData} />
}
