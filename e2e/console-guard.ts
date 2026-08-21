/**
 * ブラウザのコンソール出力と未捕捉例外を集めて判定するための道具立て。
 *
 * スモークテストの目的は「主要ページが開いて、コンソールにエラーが出ない」ことの担保。
 * とくに Next.js / React / MUI のような描画の根幹に関わる依存を更新したとき、
 * ビルドと型チェックが通っても実行時に壊れることがあるため、それを機械的に検出する。
 */
import type { ConsoleMessage, Page } from '@playwright/test'

/**
 * hydration 不一致を示す文言。
 *
 * React はバージョンによって文面を変えるため、単一の文字列ではなく複数の言い回しを拾う。
 * これに一致したものは「許容リスト」を無視して必ず失敗させる（#66 の検証で使った判定）。
 *
 * ただしこの文言が読めるのは dev だけで、本番ビルドでは
 * `Minified React error #418` のような番号に置き換わる。
 * 本番ビルド側は {@link MINIFIED_HYDRATION_ERROR_CODES} で拾う。
 */
export const HYDRATION_PATTERN =
    /hydrat|did not match|Text content does not match|server rendered HTML|server-rendered HTML|tree hydrated/i

/** 本番ビルドで出る `Minified React error #418` 形式から番号を取り出す */
const MINIFIED_REACT_ERROR_PATTERN = /Minified React error #(\d+)/

/**
 * hydration 段階の失敗を表す React のエラーコード。
 *
 * 本番ビルドではエラーメッセージが番号に置き換わるため、
 * {@link HYDRATION_PATTERN} では捕まえられない
 * （`typeof window` による分岐を仕込んで実測したところ #418 になった）。
 *
 * 一覧は React 公式のエラーコード表
 * （facebook/react の `scripts/error-codes/codes.json`）から、
 * dev の文面が {@link HYDRATION_PATTERN} に一致するものだけを選んでいる。
 * こうすることで dev と本番ビルドで同じものが hydration として分類される。
 *
 * - 418: Hydration failed because the server rendered %s didn't match the client.
 * - 421: This Suspense boundary received an update before it finished hydrating.
 * - 422: There was an error while hydrating but React was able to recover by
 *        instead client rendering from the nearest Suspense boundary.
 * - 423: There was an error while hydrating but React was able to recover by
 *        instead client rendering the entire root.
 * - 424: This root received an early update, before anything was able hydrate.
 * - 425: Text content does not match server-rendered HTML.
 */
const MINIFIED_HYDRATION_ERROR_CODES = new Set(['418', '421', '422', '423', '424', '425'])

/**
 * hydration 段階の失敗かどうかを判定する。
 * dev は文言で、本番ビルドは React のエラーコードで見分ける。
 */
function isHydrationFailure(text: string): boolean {
    if (HYDRATION_PATTERN.test(text)) return true

    const minified = text.match(MINIFIED_REACT_ERROR_PATTERN)
    return minified !== null && MINIFIED_HYDRATION_ERROR_CODES.has(minified[1])
}

/** 収集したコンソール出力1件 */
export interface ConsoleRecord {
    /** `console.error` / `console.warn` / 未捕捉例外（pageerror）の区別 */
    type: 'error' | 'warning' | 'pageerror'
    /** 出力本文 */
    text: string
    /** 発生位置（`pageerror` では取得できないため undefined） */
    location?: string
}

/** 既知の許容パターン。**追加するときは必ず理由を書くこと** */
interface IgnoreRule {
    pattern: RegExp
    /** なぜ落とさなくてよいのか */
    reason: string
    /** 適用するルート名（e2e/routes.ts の `name`）。省略時は全ルート */
    routes?: string[]
}

/**
 * 既知のノイズとして許容するコンソール出力。
 *
 * ここに足すのは「アプリの不具合ではないと確認できたもの」だけにすること。
 * 広いパターン（`/Error/` など）を置くと検出したい退行まで一緒に隠れる。
 * なお hydration 不一致にマッチするものはこのリストより優先して失敗させるため、
 * ここに書いても素通りはしない。
 */
export const IGNORE_RULES: IgnoreRule[] = [
    {
        // Google Maps JS API は `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` が
        // 未設定・無効・リファラ制限ありのいずれでもコンソールにエラーを出す。
        // 鍵を持たない環境（CI や clone 直後）では必ず出るうえ、これは外部SDKの応答であって
        // このアプリの描画の問題ではないため、マップを表示するルートに限って許容する。
        // 鍵が有効な環境では単に一致しないだけなので、判定が緩むことはない。
        //
        // エラーコード名（`InvalidKeyMapError` など）は列挙せず、
        // Google が必ず付ける接頭辞だけで識別する。理由は2つ。
        //  - 列挙では網羅できない。鍵に無効な値を入れると `InvalidKeyMapError`、
        //    空文字にすると `ApiProjectMapError` が出る（どちらも実測）。
        //    後者は列挙に含めていなかったもので、この方式はコード名を足し続けることになる。
        //  - コード名の部分一致は広すぎる。`[A-Za-z]+MapError` や `InvalidKey` は
        //    アプリ側が出したエラー文にも当たり得るため、何を握り潰しているのか読めない。
        // 接頭辞は `Google Maps JavaScript API error: <コード名>` と
        // 同 `warning: <コード名>` の2種類（Maps の error-messages ドキュメント）。
        //
        // `maps.googleapis.com` を別の選択肢として残しているのは、SDKのスクリプト自体の
        // 読み込みに失敗した場合は上記の接頭辞が付かないため。
        // `^` が掛かるのは最初の選択肢だけ（こちらは文中に現れるので先頭固定にしない）。
        pattern: /^Google Maps JavaScript API (?:error|warning): |maps\.googleapis\.com/,
        reason: 'Google Maps JS API の鍵に起因する外部SDKのエラー。アプリ側の描画とは無関係',
        routes: ['top', 'stores-map']
    },
    {
        // `<gmp-pin>: The \`element\` property is deprecated.` のような、
        // Google Maps の Web Components（`gmp-` 接頭辞）が出す非推奨警告。
        // 出しているのは `@vis.gl/react-google-maps` の `<Pin>` の内部実装であり、
        // このリポジトリのコードからは制御できない。
        // ライブラリ側の追随待ちなので、更新時にこの行が不要になっていないか見直すこと。
        //
        // `deprecat` を必須にしているのは、これらのコンポーネントが非推奨警告以外に
        // 属性の指定ミスなどの実エラーも同じ `<gmp-...>:` 接頭辞で出すため。
        // 接頭辞だけで許容すると、こちらの使い方の誤りまで一緒に握り潰してしまう。
        pattern: /^<gmp-[a-z-]+>:[\s\S]*deprecat/i,
        reason: '@vis.gl/react-google-maps が使う Google Maps Web Components の非推奨警告。ライブラリ側の追随待ち',
        routes: ['top', 'stores-map']
    },
    {
        // ヘッドレス Chromium には WebGL が無いためベクターマップの初期化に失敗し、
        // ラスターマップにフォールバックする。実行環境の制約であって不具合ではない。
        pattern: /Attempted to load a Vector Map, but failed\. Falling back to Raster/,
        reason: 'ヘッドレス環境に WebGL が無いことによるラスターマップへのフォールバック',
        routes: ['top', 'stores-map']
    }
]

/**
 * ページにリスナーを張り、コンソール出力と未捕捉例外を集める。
 *
 * `page.goto()` より前に呼ぶこと。呼び出し後に発生したものだけが記録される。
 *
 * @param page 対象ページ
 * @returns 収集先の配列（テスト進行に応じて中身が増える）
 */
export function collectConsoleRecords(page: Page): ConsoleRecord[] {
    const records: ConsoleRecord[] = []

    page.on('console', (message: ConsoleMessage) => {
        const type = message.type()
        if (type !== 'error' && type !== 'warning') return

        const { url, lineNumber, columnNumber } = message.location()
        records.push({
            type,
            text: message.text(),
            location: url ? `${url}:${lineNumber}:${columnNumber}` : undefined
        })
    })

    page.on('pageerror', (error: Error) => {
        records.push({ type: 'pageerror', text: error.message })
    })

    return records
}

/** 収集結果を hydration / 失敗させるもの / 許容したもの に振り分けた結果 */
export interface ClassifiedRecords {
    /** hydration 不一致。許容リストを無視して必ず失敗させる */
    hydration: ConsoleRecord[]
    /** 許容リストに載っていない error / warning / pageerror */
    failures: ConsoleRecord[]
    /** 許容リストに載っていたもの。理由つきでレポートに残す */
    ignored: { record: ConsoleRecord; reason: string }[]
}

/**
 * 収集したコンソール出力を分類する。
 *
 * @param records 収集結果
 * @param routeName 対象ルート名（許容リストのルート限定判定に使う）
 */
export function classifyRecords(records: ConsoleRecord[], routeName: string): ClassifiedRecords {
    const result: ClassifiedRecords = { hydration: [], failures: [], ignored: [] }

    for (const record of records) {
        // hydration 不一致は許容リストより先に判定する。
        // 描画の根幹が壊れているサインなので、例外を作らない。
        if (isHydrationFailure(record.text)) {
            result.hydration.push(record)
            continue
        }

        const rule = IGNORE_RULES.find(
            (candidate) =>
                candidate.pattern.test(record.text) &&
                (candidate.routes === undefined || candidate.routes.includes(routeName))
        )

        if (rule) {
            result.ignored.push({ record, reason: rule.reason })
            continue
        }

        result.failures.push(record)
    }

    return result
}

/**
 * 収集したコンソール出力を失敗メッセージ用の複数行テキストに整形する。
 */
export function formatRecords(records: ConsoleRecord[]): string {
    return records
        .map((record) => {
            const location = record.location ? `\n      at ${record.location}` : ''
            return `  [${record.type}] ${record.text}${location}`
        })
        .join('\n')
}
