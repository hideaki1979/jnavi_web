/**
 * テスト開始前に、実在する店舗IDを1件取得して `E2E_STORE_ID` に入れる。
 *
 * `/stores/simulation/precall` と `/stores/simulation/postcall` は
 * `?id=` で渡された店舗のトッピングコール情報をAPIから取得する。
 * ここでIDを決め打ちにすると、実バックエンドのDBにそのIDが無い環境で
 * 「APIが404を返す」状態を検証することになり、スモークテストとして意味を成さない。
 *
 * そこで `GET /stores` の先頭の店舗を使う。
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
 * 店舗IDが取れないのは、バックエンドが壊れているか（Docker停止時はAPIが500を返す）、
 * DBが空かのどちらか。どちらも実行前に直すべき環境の問題なので、
 * バックエンド未起動を e2e/require-backend.mjs で止めているのと同じ理由で、
 * ここでも環境の問題は環境の問題として実行前に止める。
 *
 * ここで `process.env` に入れた値は、この後 fork されるワーカーに引き継がれる。
 * 読み取り側は e2e/routes.ts。
 */

/** APIの応答待ちの上限。起動確認は webServer 側で済んでいるので短めでよい */
const FETCH_TIMEOUT_MS = 10_000

/** 失敗時に、原因と次の一手が分かる形にまとめる */
function abort(cause: string): never {
    throw new Error(
        [
            `[e2e] 店舗IDを特定できませんでした：${cause}`,
            '',
            '店舗IDに依存するルート（事前コール／着丼前コール）は、実在しない店舗を開くと',
            'コンソールに [ActionError] ... status:404 を出して失敗します。',
            'アプリの退行と紛らわしいので、環境の問題はここで止めています。',
            '',
            '確認すること：',
            '  - PostgreSQL（docker compose の jnavi-postgres / localhost:5433）が起動しているか',
            '    ※ 停止しているとバックエンドのプロセスが生きていてもAPIは500を返します',
            '  - 店舗が1件以上登録されているか（GET /stores の data が空でないか）',
            '',
            'バックエンド無しで回すなら E2E_USE_MOCK_API=1 を付けてください。'
        ].join('\n')
    )
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

    let firstId: string | number | undefined | null

    try {
        const response = await fetch(`${apiUrl}/stores`, {
            signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
        })

        if (!response.ok) {
            throw new Error(`GET /stores が HTTP ${response.status} を返しました`)
        }

        // バックエンドの成功レスポンスは `{ success, message, data }`（src/types/api.ts）
        const body: { data?: { id?: string | number }[] } = await response.json()
        firstId = body.data?.[0]?.id
    } catch (error) {
        abort(`${apiUrl}/stores の取得に失敗しました（${error instanceof Error ? error.message : String(error)}）`)
    }

    if (firstId === undefined || firstId === null) {
        abort(`${apiUrl}/stores は成功しましたが、店舗が1件も登録されていません`)
    }

    process.env.E2E_STORE_ID = String(firstId)
    console.log(`[e2e] 店舗IDに依存するルートは id=${process.env.E2E_STORE_ID} で実行します。`)
}
