/**
 * テスト開始前に、実在する店舗IDを1件取得して `E2E_STORE_ID` に入れる。
 *
 * `/stores/simulation/precall` と `/stores/simulation/postcall` は
 * `?id=` で渡された店舗のトッピングコール情報をAPIから取得する。
 * ここでIDを決め打ちにすると、実バックエンドのDBにそのIDが無い環境で
 * 「APIが404を返す」状態を検証することになり、スモークテストとして意味を成さない。
 *
 * そこで `GET /stores` の先頭の店舗を使う。
 * 取得できなかった場合はフォールバックのIDで続行し、警告だけ出す
 * （他のルートは店舗IDに依存しないので、ここで全体を止める必要は無い）。
 *
 * ここで `process.env` に入れた値は、この後 fork されるワーカーに引き継がれる。
 * 読み取り側は e2e/routes.ts。
 */
/** 店舗が1件も取れなかったときに使うID */
const FALLBACK_STORE_ID = '1'

/** APIの応答待ちの上限。起動確認は webServer 側で済んでいるので短めでよい */
const FETCH_TIMEOUT_MS = 10_000

export default async function globalSetup(): Promise<void> {
    // playwright.config.ts が `.env` を読み込んだうえで、スタブ利用時は
    // スタブのURLを `process.env` に入れている
    const apiUrl =
        process.env.E2E_USE_MOCK_API === '1'
            ? `http://127.0.0.1:${process.env.E2E_MOCK_API_PORT ?? 3300}`
            : process.env.NEXT_PUBLIC_API_URL

    if (!apiUrl) {
        process.env.E2E_STORE_ID = FALLBACK_STORE_ID
        return
    }

    try {
        const response = await fetch(`${apiUrl}/stores`, {
            signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
        })

        if (!response.ok) {
            throw new Error(`GET /stores が HTTP ${response.status} を返しました`)
        }

        // バックエンドの成功レスポンスは `{ success, message, data }`（src/types/api.ts）
        const body: { data?: { id?: string | number }[] } = await response.json()
        const firstId = body.data?.[0]?.id

        if (firstId === undefined || firstId === null) {
            console.warn(
                '[e2e] 店舗が1件も登録されていません。' +
                `店舗IDに依存するルートは id=${FALLBACK_STORE_ID} で実行します。`
            )
            process.env.E2E_STORE_ID = FALLBACK_STORE_ID
            return
        }

        process.env.E2E_STORE_ID = String(firstId)
        console.log(`[e2e] 店舗IDに依存するルートは id=${process.env.E2E_STORE_ID} で実行します。`)
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        console.warn(
            `[e2e] 店舗一覧を取得できませんでした（${message}）。` +
            `店舗IDに依存するルートは id=${FALLBACK_STORE_ID} で実行します。`
        )
        process.env.E2E_STORE_ID = FALLBACK_STORE_ID
    }
}
