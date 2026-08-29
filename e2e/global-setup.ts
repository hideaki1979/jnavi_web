/**
 * テスト開始前に、スモークテストが前提にする実データをAPIから取り出して環境変数に入れる。
 *
 * - `E2E_STORE_ID`：実在する店舗ID。事前コール／着丼前コールが `?id=` に使う
 * - `E2E_MAP_LATITUDE` / `E2E_MAP_LONGITUDE`：地図に出せる店舗の座標。
 *   マップを開くときの現在地に使う
 *
 * どちらも決め打ちにはできない。実バックエンドのDBに何が入っているかは環境によって違い、
 * 存在しないIDを開けば「APIが404を返す」状態を、店舗のいない場所を開けば
 * 「ピンが1本も無いマップ」を検証することになり、スモークテストとして意味を成さない。
 *
 * ## 取得できなかったときはフォールバックせず、実行前に落とす
 *
 * 以前は固定ID（1）で続行して警告だけ出していた。
 * そのIDが実在しない環境では、事前コール／着丼前コールの2ルートが
 * `[ActionError] {"message":"...","status":404}` をコンソールに出して失敗する
 * （`unwrapActionResult` がブラウザ側で必ず出力するので dev・本番ビルドとも同じ。
 * 実際に404を返すAPIを立てて確認済み）。
 * 見逃しはしないが、環境の問題がアプリの退行の顔をして出てくるうえ、
 * 根拠になる警告行はサーバーログに埋もれて原因にたどり着きにくい。
 *
 * 座標の側も同じ。`GET /maps` が空の環境では、マップは正しく動いていても
 * ピンを1本も描けない。これを描画の退行として報告すると、
 * 直すべき場所（DBの中身）と報告される場所（アプリ）がずれる。
 *
 * データが取れないのは、バックエンドが壊れているか（Docker停止時はAPIが500を返す）、
 * DBが空かのどちらか。どちらも実行前に直すべき環境の問題なので、
 * バックエンド未起動を e2e/require-backend.mjs で止めているのと同じ理由で、
 * ここでも環境の問題は環境の問題として実行前に止める。
 *
 * ここで `process.env` に入れた値は、この後 fork されるワーカーに引き継がれる。
 * 読み取り側は e2e/routes.ts と e2e/smoke.spec.ts。
 */

/** APIの応答待ちの上限。起動確認は webServer 側で済んでいるので短めでよい */
const FETCH_TIMEOUT_MS = 10_000

/** 失敗時に、原因と次の一手が分かる形にまとめる */
function abort(cause: string): never {
    throw new Error(
        [
            `[e2e] スモークテストの前提データを用意できませんでした：${cause}`,
            '',
            '店舗IDに依存するルート（事前コール／着丼前コール）は、実在しない店舗を開くと',
            'コンソールに [ActionError] ... status:404 を出して失敗します。',
            'マップは店舗の座標を現在地にして開くため、座標が取れないとピンを検証できません。',
            'どちらもアプリの退行と紛らわしいので、環境の問題はここで止めています。',
            '',
            '確認すること：',
            '  - PostgreSQL（docker compose の jnavi-postgres / localhost:5433）が起動しているか',
            '    ※ 停止しているとバックエンドのプロセスが生きていてもAPIは500を返します',
            '  - 店舗が1件以上登録されているか（GET /stores の data が空でないか）',
            '  - 座標を持つ店舗が1件以上あるか（GET /maps の data が空でないか）',
            '',
            'バックエンド無しで回すなら E2E_USE_MOCK_API=1 を付けてください。'
        ].join('\n')
    )
}

/**
 * 成功レスポンス（`{ success, message, data }`）から配列の `data` を取り出す。
 *
 * 型注釈で受けるだけでは実行時には何も確かめていないので、形をここで検証する
 * （`src/lib/ApiClient.ts` の `assertEnvelope` と同じ考え方）。
 * 前提が崩れたまま先へ進むと、`undefined` を店舗IDとして扱うような
 * 分かりにくい失敗になる。
 *
 * 取得も検証も失敗すれば実行前に止める（{@link abort}）。
 *
 * @param url 取得先
 * @returns `data` の中身（要素の形は呼び出し側で確かめる）
 */
async function fetchDataArray(url: string): Promise<unknown[]> {
    try {
        const response = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) })

        if (!response.ok) {
            throw new Error(`HTTP ${response.status} を返しました`)
        }

        const body: unknown = await response.json()

        if (typeof body !== 'object' || body === null || !('data' in body) || !Array.isArray(body.data)) {
            throw new Error('レスポンスが { data: [...] } の形ではありません')
        }

        return body.data
    } catch (error) {
        abort(`${url} の取得に失敗しました（${error instanceof Error ? error.message : String(error)}）`)
    }
}

/**
 * 店舗IDを取り出す。
 *
 * 契約上、`BigInt` は文字列で届く（`src/types/api.ts` のコメント参照）。
 * ただし数値で来てもURLには載せられるので、どちらも受ける。
 *
 * @param entry `GET /stores` の要素
 * @returns URLに載せられる形の店舗ID。取り出せなければ null
 */
function readStoreId(entry: unknown): string | null {
    if (typeof entry !== 'object' || entry === null || !('id' in entry)) return null

    const { id } = entry
    if (typeof id === 'number' && Number.isFinite(id)) return String(id)
    if (typeof id === 'string' && id.trim() !== '') return id

    return null
}

/**
 * 緯度・経度として使える数値に変換する。
 *
 * `Decimal` は文字列で届くため `Number()` を通すが、`Number(null)` が 0、
 * `Number('')` が 0 になる点に注意が必要なので、先に型と空文字を弾く。
 * 0 は赤道・本初子午線として成立する値なので、変換後の値では判別できない。
 *
 * @param value 緯度または経度
 * @returns 有限の数値。変換できなければ null
 */
function toCoordinate(value: unknown): number | null {
    if (typeof value === 'number') return Number.isFinite(value) ? value : null
    if (typeof value !== 'string' || value.trim() === '') return null

    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
}

/**
 * 店舗の座標を取り出す。
 *
 * @param entry `GET /maps` の要素
 * @returns 緯度・経度。片方でも取り出せなければ null
 */
function readCoordinates(entry: unknown): { latitude: number; longitude: number } | null {
    if (typeof entry !== 'object' || entry === null) return null
    if (!('latitude' in entry) || !('longitude' in entry)) return null

    const latitude = toCoordinate(entry.latitude)
    const longitude = toCoordinate(entry.longitude)
    if (latitude === null || longitude === null) return null

    return { latitude, longitude }
}

export default async function globalSetup(): Promise<void> {
    // playwright.config.ts が `.env` を読み込んだうえで、スタブ利用時は
    // スタブのURLを `process.env` に入れている
    const apiUrl =
        process.env.E2E_USE_MOCK_API === '1'
            ? `http://127.0.0.1:${process.env.E2E_MOCK_API_PORT ?? 3300}`
            : process.env.NEXT_PUBLIC_API_URL

    if (!apiUrl) {
        abort('NEXT_PUBLIC_API_URL が解決できません')
    }

    // 2本とも読み取り専用なので並列で取る
    const [stores, maps] = await Promise.all([
        fetchDataArray(`${apiUrl}/stores`),
        fetchDataArray(`${apiUrl}/maps`)
    ])

    const storeId = readStoreId(stores[0])
    if (storeId === null) {
        abort(
            stores.length === 0
                ? `${apiUrl}/stores は成功しましたが、店舗が1件も登録されていません`
                : `${apiUrl}/stores の先頭の店舗から id を取り出せませんでした`
        )
    }

    const coordinates = readCoordinates(maps[0])
    if (coordinates === null) {
        abort(
            maps.length === 0
                ? `${apiUrl}/maps は成功しましたが、地図に出せる店舗が1件もありません`
                : `${apiUrl}/maps の先頭の店舗から緯度・経度を取り出せませんでした`
        )
    }

    process.env.E2E_STORE_ID = storeId
    process.env.E2E_MAP_LATITUDE = String(coordinates.latitude)
    process.env.E2E_MAP_LONGITUDE = String(coordinates.longitude)

    console.log(`[e2e] 店舗IDに依存するルートは id=${storeId} で実行します。`)
    console.log(
        `[e2e] マップは現在地を ${coordinates.latitude},${coordinates.longitude}（店舗の座標）にして開きます。`
    )
}
