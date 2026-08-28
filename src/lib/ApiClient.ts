import { ActionErrorPayload } from "@/types/actionResult"
import { ApiEnvelope, ApiMessageEnvelope } from "@/types/api"
import { ApiErrorResponse, ExpressValidationError } from "@/types/validation"
import axios, { AxiosError, AxiosInstance } from "axios"

/**
 * APIレスポンスのエンベロープ（殻）が契約どおりでなかったことを表す例外。
 *
 * 非2xx は axios が reject するため既存の catch に乗るが、
 * 「2xx なのにボディが契約と違う」経路は何も検知せず素通りしてしまう。
 * その経路を例外に変換して、他のAPIエラーと同じ扱いに合流させるための型。
 *
 * `message` は画面にも出るため、受信したボディそのものは載せない
 * （プロキシが返したHTML全文などがそのまま表示されるのを避ける）。
 * 診断に要る情報は ApiClient 側でログに出すが、そちらにも中身は残さず
 * 型・長さ・キー名だけにしている。
 */
export class ApiContractError extends Error {
    /** 契約違反が起きた呼び出し（例：`GET /maps`） */
    public readonly context: string

    constructor(context: string, reason: string) {
        super(`APIレスポンスが契約と異なります（${context}）：${reason}`)
        this.name = "ApiContractError"
        this.context = context
    }
}

/**
 * axiosを用いたAPIクライアントのシングルトン実装。
 * - APIインスタンスの取得
 * - 共通エラーハンドリング
 * - レスポンスエンベロープの実行時検証
 */
class ApiClient {
    private static instance: AxiosInstance

    /**
     * 書き込み呼び出しが契約違反を受けたときに画面へ添える一文。
     * 再送信して重複登録させないことが目的なので、原因ではなく次の行動を伝える。
     */
    private static readonly WRITE_UNCERTAIN_NOTICE =
        "ただし処理は完了している可能性があります。再実行の前に結果を確認してください。"

    /**
     * APIクライアントのシングルトンインスタンスを取得
     */
    public static getInstance(): AxiosInstance {
        if (!ApiClient.instance) {
            ApiClient.instance = axios.create({
                baseURL: process.env.NEXT_PUBLIC_API_URL,
                headers: {
                    "Content-Type": "application/json"
                }
            })
        }
        return ApiClient.instance
    }

    /* ------------------------------------------------------------------
     * ログ出力の共通方針
     *
     * 外部から受け取った値の「中身」はログに残さない。
     * ここでいう外部にはバックエンドだけでなく、その手前に入りうる
     * プロキシやCDNも含まれるため、何が入っているかを列挙できない。
     * 長さで切り詰めても「何を出さないか」を決めたことにはならないので、
     * 内容そのものを持ち出さず、型・構造・列挙値だけを残す。
     *
     * 認証トークンを残さないため AxiosError を出力しない既存の判断
     * （{@link toActionError} 内のコメント）と同じ考え方を、
     * レスポンスボディとバリデーション詳細にも広げたもの。
     * ------------------------------------------------------------------ */

    /**
     * 受信ボディの素性をログ用に短く表す。
     *
     * **中身は一切出さない。** 型・長さ・（オブジェクトなら）キー名だけにする。
     * 契約違反時のボディは外部（バックエンドの手前にあるプロキシ等）が組み立てた
     * ものでもあり得るため、何が入っているかを列挙できない。
     * 長さで切り詰めても「何を出さないか」を決めたことにはならないので、
     * 内容そのものを持ち出さない方針で揃える。
     * リクエストヘッダーの認証トークンを残さないため AxiosError を出力しない
     * {@link toActionError} と同じ考え方。
     *
     * 切り分けに要るのは「どのキーが欠けたか」「JSONですらないのか」までで、
     * それは値を出さなくても分かる。
     */
    private static describeBody(body: unknown): string {
        if (body === null) return "null"
        if (Array.isArray(body)) return `array(length=${body.length})`
        if (typeof body === "object") {
            // キー名は構造であって値ではない。どのキーが欠けているかが
            // 契約違反の原因そのものなので、ここだけは残す
            const keys = Object.keys(body)
            const shown = keys.slice(0, 10).join(", ")
            return `object(keys=[${shown}${keys.length > 10 ? ", …" : ""}])`
        }
        if (typeof body === "string") {
            return `string(length=${body.length}, shape=${ApiClient.describeStringShape(body)})`
        }
        return typeof body
    }

    /**
     * 文字列ボディの「見た目」だけを分類する。中身は出さない。
     *
     * 文字列で届くのは axios がJSONとしてパースできなかった場合で、
     * 切り分けたいのは次の2つ。どちらも先頭1文字で判別でき、内容は要らない。
     * - `html-like`：プロキシやCDNが 200 でエラーページを返した
     * - `json-like`：JSONなのに Content-Type が違ってパースされなかった
     */
    private static describeStringShape(body: string): string {
        const head = body.trimStart().charAt(0)
        if (head === "<") return "html-like"
        if (head === "{" || head === "[") return "json-like"
        return "text"
    }

    /**
     * authMiddleware が返す認証エラーの種別。
     * ログへ出すのはこの3つに一致した場合だけにする（{@link toAuthStatus}）。
     */
    private static readonly AUTH_STATUSES: ReadonlySet<string> = new Set([
        "Unauthorized",
        "TokenExpired",
        "InvalidToken"
    ])

    /**
     * 認証エラーの種別として妥当な値だけを取り出す。
     *
     * `AxiosError<ApiErrorResponse>` の型引数は「バックエンドがこの形を返す」という
     * 宣言でしかなく、実際のボディは検証されていない（#98 でエンベロープに対して
     * 扱った問題と同じ）。`status` をそのまま出力すると、応答した誰かが決めた
     * 任意の文字列をログへ流し込むことになる。
     *
     * 既知の列挙値に一致したときだけ残し、それ以外は捨てる。
     * ボディの素性は `responseType` 側で分かるため、捨てても切り分けは進む。
     */
    private static toAuthStatus(status: unknown): string | undefined {
        return typeof status === "string" && ApiClient.AUTH_STATUSES.has(status)
            ? status
            : undefined
    }

    /**
     * 最初に見つかった空でない文字列を返す。
     *
     * `responseData?.error` などは型の上では `string` だが実際には検証されていない。
     * `||` で繋いだままだとオブジェクトや数値がテンプレートリテラルに入り、
     * `[object Object]` が画面に出る。文字列であることを確かめてから使う。
     */
    private static firstNonEmptyString(...values: unknown[]): string | undefined {
        return values.find((value): value is string => typeof value === "string" && value.length > 0)
    }

    /**
     * エラーレスポンスの `details` から、扱える形の要素だけを取り出す。
     *
     * `Array.isArray` だけでは中身が保証されない。`details: [null]` のような形が
     * 返ると、`value` を落とす際の分割代入が TypeError で落ちる。
     * これは catch の中で起きるため、エラー処理そのものが壊れて
     * Next.js にサニタイズされた汎用エラーへ化ける。
     *
     * 併せて `ActionErrorPayload.errors` の型（`ExpressValidationError[]`）を
     * 実態と一致させる意味もある。`msg` は必須項目なので、
     * それが文字列である要素だけを通す。
     */
    private static toValidationErrors(details: unknown): ExpressValidationError[] | undefined {
        // 配列でなければ詳細なしとして扱う（空配列はそのまま空配列で返す）
        if (!Array.isArray(details)) return undefined
        return details.filter(ApiClient.isValidationError)
    }

    private static isValidationError(detail: unknown): detail is ExpressValidationError {
        if (typeof detail !== "object" || detail === null) return false
        const record = detail as Record<string, unknown>
        return typeof record.msg === "string"
    }

    /**
     * バリデーション詳細から `value`（利用者が入力した値）を落とす。
     *
     * バックエンドは既に同じ判断を下している（nodedeploytest の zodValidation.ts）。
     * レスポンスの `details` は移行前の形を保つため `value` を含めるが、
     * バックエンド自身のログでは落としている——メールアドレスやプロフィールが
     * そのままログに残るのを避けるため。
     * その `details` をフロントがログへそのまま出すと、
     * バックエンドが意図して落とした値をこちら側で復活させてしまう。
     *
     * どの項目がどのルールで落ちたかは `path` / `msg` / `location` で追えるため、
     * `value` が無くても調査はできる。
     * 画面表示用に返す {@link ActionErrorPayload} は変更しない（ログだけの措置）。
     */
    private static redactValidationErrors(
        errors: ExpressValidationError[] | undefined
    ): Omit<ExpressValidationError, "value">[] | undefined {
        return errors?.map(({ value, ...rest }) => {
            void value
            return rest
        })
    }

    /**
     * エラーハンドラー - express-validationのエラー情報に対応
     *
     * API呼び出しで発生した例外を、Server Action の戻り値として返せる
     * シリアライズ可能なエラー情報（{@link ActionErrorPayload}）へ変換する。
     * Server Action 内で throw すると本番ビルドでメッセージがサニタイズされ
     * クライアントへ届かないため、例外ではなく戻り値としてエラーを伝搬させる。
     *
     * @param error 発生した例外
     * @param defaultMessage axiosエラー以外の場合に使用するメッセージ
     * @returns Server Action の戻り値に載せるエラー情報
     */
    public static toActionError(
        error: unknown,
        defaultMessage: string = "予期せぬエラーが発生しました。"
    ): ActionErrorPayload {
        if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError<ApiErrorResponse>
            const responseData = axiosError.response?.data

            // APIからのエラーメッセージを優先
            // バックエンドは { success: false, error: string } 形式で返すため `error` を最優先で読む
            // （`message` は旧形式との互換用フォールバック）
            const errorMessage = ApiClient.firstNonEmptyString(responseData?.error, responseData?.message)
                ?? axiosError.message

            // バリデーションエラーの詳細は `details`（旧形式は `errors`）に入る
            const validationDetails = ApiClient.toValidationErrors(
                responseData?.details ?? responseData?.errors
            )

            const status = axiosError.response?.status

            const payload: ActionErrorPayload = {
                message: `API呼出中にエラー発生：${errorMessage}`,
                errors: validationDetails,
                status
            }

            // 画面には message のみ表示するため、原因調査に必要な情報はここでログに残す。
            // ※ AxiosError そのものは出力しない（リクエストヘッダーの認証トークンまでログに残るため）
            // ※ エラーボディも全量は出力しない。プロキシが返したHTML等が丸ごと残りうるうえ、
            //    バックエンドの既知形式から読める内容は payload に入っている
            console.error(`[ApiClient] ${defaultMessage}`, JSON.stringify({
                method: axiosError.config?.method,
                url: axiosError.config?.url,
                status,
                responseType: ApiClient.describeBody(responseData),
                // authMiddleware の 401 だけ種別がここに入る（TokenExpired / InvalidToken /
                // Unauthorized）。payload には載らないが再ログイン導線の要否判断に要る。
                // ただしボディは検証されていないため、既知の列挙値に一致したものだけを残す
                authStatus: ApiClient.toAuthStatus(responseData?.status),
                payload: { ...payload, errors: ApiClient.redactValidationErrors(payload.errors) }
            }))

            return payload
        }

        if (error instanceof Error) {
            const payload: ActionErrorPayload = { message: `${defaultMessage}：${error.message}` }
            console.error(`[ApiClient] ${defaultMessage}`, JSON.stringify({
                name: error.name,
                stack: error.stack,
                payload
            }))
            return payload
        }

        const payload: ActionErrorPayload = { message: defaultMessage }
        // 型不明の値は循環参照でJSON.stringifyが失敗し得るため文字列化して出力する
        console.error(`[ApiClient] ${defaultMessage}`, JSON.stringify({
            error: String(error),
            payload
        }))
        return payload
    }

    /**
     * 書き込み呼び出し（登録・更新・削除）の失敗結果を組み立てる。
     *
     * 2xx を受け取ったうえでの契約違反（{@link ApiContractError}）は、
     * 読み取りと意味が違う。**サーバー側の書き込みは成立している可能性が高い**ため、
     * 通常の失敗と同じ文言で返すと利用者が再送信し、重複登録に繋がる
     * （app/api/images.ts の updateTag の配置も同じ理由で決まっている）。
     *
     * かといって成功とも言えない。プロキシが 200 でHTMLを返してバックエンドへ
     * 届いていない可能性も同じ経路に含まれるためである。
     * どちらとも断定できないので、「結果を確認してほしい」と伝わる文言にする。
     *
     * @param error 発生した例外
     * @param defaultMessage 契約違反以外で使用するメッセージ
     * @returns Server Action の戻り値に載せるエラー情報
     */
    public static toWriteActionError(error: unknown, defaultMessage: string): ActionErrorPayload {
        if (!(error instanceof ApiContractError)) {
            return ApiClient.toActionError(error, defaultMessage)
        }

        // 契約違反の詳細（ボディの型・キー・冒頭）は contractError が既にログへ出している。
        // ここで toActionError を通すと同じ事象で2行出るだけなので、画面用の文言だけを組み立てる
        const head = defaultMessage.endsWith("。") ? defaultMessage : `${defaultMessage}。`
        return { message: `${head}${ApiClient.WRITE_UNCERTAIN_NOTICE}` }
    }

    /* ------------------------------------------------------------------
     * レスポンスエンベロープの実行時検証
     *
     * `api.get<ApiEnvelope<T>>()` のような型引数は「バックエンドがこの形を返す」
     * というコンパイラへの宣言であって、実行時にレスポンスを検証する処理ではない。
     * 2xx で返ってきたボディが契約と違っていても例外にならず、
     * `res.data.data` が undefined のまま成功結果として扱われてしまう。
     * 読み取り系は `cacheLife("hours")` で保持するため、その結果が長時間残る。
     *
     * ここで検証するのは「殻」だけで、`data` の中身（ペイロード）は見ない。
     * ペイロードのスキーマ検証はフロントの型が実レスポンスと一致していることが前提で、
     * 別の作業として切り分けている（#97 で型ズレを解消済み・スキーマ化は未着手）。
     *
     * 契約違反は throw する。各呼び出しの try の中で投げれば、既存の
     * catch → toActionError → cacheLife("seconds") の経路にそのまま乗るため、
     * 呼び出し側に足す記述が最小で済む。
     * ------------------------------------------------------------------ */

    /**
     * 契約違反をログに残したうえで例外を組み立てる。
     *
     * 例外の `message` には載せられない診断情報（ボディの型・長さ・キー名）を
     * ここで出力する。解釈地点でログを出すのは {@link toActionError} と同じ方針。
     * この例外は最終的に `toActionError` にも渡るため出力は2行になるが、
     * それぞれ「何が返ってきたか」と「利用者に何を見せたか」で内容が異なる。
     *
     * 受信ボディの中身は画面にもログにも出さない（{@link describeBody} 参照）。
     */
    private static contractError(context: string, reason: string, body: unknown): ApiContractError {
        console.error("[ApiClient] APIレスポンスの契約違反", JSON.stringify({
            context,
            reason,
            bodyType: ApiClient.describeBody(body)
        }))
        return new ApiContractError(context, reason)
    }

    /**
     * `data` を読まない呼び出し向けのエンベロープ検証。
     *
     * `success === true` と `message` が文字列であることだけを見る。
     * 実レスポンスには `data` キーも存在するが、この型は中身を確定させない契約なので
     * ここでも存在を要求しない（{@link ApiMessageEnvelope} 参照）。
     *
     * @param body axios が返した `res.data`（＝レスポンスボディ）
     * @param context 呼び出しの識別子。ログと例外メッセージに載る（例：`POST /stores`）
     * @returns 検証済みのエンベロープ
     * @throws {ApiContractError} 殻が契約と異なる場合
     */
    public static assertMessageEnvelope(body: unknown, context: string): ApiMessageEnvelope {
        // 配列を弾くのは、`Array.isArray` を通さないと配列も typeof "object" になり
        // キーが無いだけのオブジェクトとして後続の判定に流れてしまうため
        if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw ApiClient.contractError(context, "レスポンスボディがオブジェクトではありません", body)
        }

        // `object` のままでは添字アクセスできないため、ここだけキャストする。
        // 値は Record の通り unknown として扱い、以降の判定で絞り込む
        const record = body as Record<string, unknown>

        if (record.success !== true) {
            throw ApiClient.contractError(context, "`success` が true ではありません", body)
        }
        if (typeof record.message !== "string") {
            throw ApiClient.contractError(context, "`message` が文字列ではありません", body)
        }

        // 検証済みの値だけで組み直す。丸ごとキャストして返すより、
        // 「何を確認して返しているか」がシグネチャと一致する
        return { success: true, message: record.message }
    }

    /**
     * `data` を読む呼び出し向けのエンベロープ検証。
     *
     * {@link assertMessageEnvelope} の判定に加えて `data` キーの存在を確認する。
     * `data` が `undefined` のまま成功として扱われるのを塞ぐのが本来の目的。
     *
     * **`data` の中身は検証しない。** 型引数 `T` はここでも「宣言」のままであり、
     * 検証されるのは殻だけである点に注意すること。
     * なお `null` は弾かない。キーが存在して値が入っている以上これは殻の問題ではなく、
     * ペイロード側で許容するかどうかの判断になるため。
     *
     * @param body axios が返した `res.data`（＝レスポンスボディ）
     * @param context 呼び出しの識別子。ログと例外メッセージに載る（例：`GET /maps`）
     * @typeParam T エンドポイントごとの本体データの型
     * @returns 検証済みのエンベロープ
     * @throws {ApiContractError} 殻が契約と異なる場合
     */
    public static assertEnvelope<T>(body: unknown, context: string): ApiEnvelope<T> {
        const { message } = ApiClient.assertMessageEnvelope(body, context)

        // assertMessageEnvelope を通った時点でオブジェクトであることは確定している
        const record = body as Record<string, unknown>

        if (!("data" in record) || record.data === undefined) {
            throw ApiClient.contractError(context, "`data` が含まれていません", body)
        }

        // 中身を検証していない唯一の箇所。ペイロードのスキーマ検証を入れるならここに足す
        return { success: true, message, data: record.data as T }
    }
}

export default ApiClient
