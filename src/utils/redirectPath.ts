/**
 * 認証リダイレクト先（`redirect_to`）の検証ユーティリティ。
 * - `redirect_to` はURLクエリ経由で外部から自由に指定できるため、
 *   オープンリダイレクト対策として自サイト内の相対パスのみを許可する
 */

/** `redirect_to` が無い・不正な場合のフォールバック遷移先 */
export const DEFAULT_REDIRECT_PATH = '/stores/map'

/** ログイン画面のパス */
export const LOGIN_PATH = '/auth/login'

/** ログイン後に戻すとループする・意味の無いパス */
const EXCLUDED_REDIRECT_PREFIXES = [LOGIN_PATH, '/auth/signup', '/api'] as const

/** 相対パスの解決にのみ使うダミーオリジン（外部URL判定用） */
const DUMMY_ORIGIN = 'http://localhost'

/** 制御文字（改行・タブ・NUL等）を含むかどうか。経路の偽装に使われうるため拒否する */
function hasControlCharacter(value: string): boolean {
    for (const char of value) {
        const code = char.codePointAt(0) ?? 0
        if (code < 0x20 || code === 0x7f) return true
    }
    return false
}

/**
 * `redirect_to` の値を検証し、安全な遷移先パスを返す。
 *
 * 自サイト内の絶対パス（`/` 始まり）のみを許可し、
 * 外部URL・プロトコル相対URL・認証ページ自身は {@link DEFAULT_REDIRECT_PATH} にフォールバックする。
 *
 * @param value `useSearchParams().get('redirect_to')` などで取得した生の値
 * @returns 遷移して良いパス（必ず `/` 始まりの自サイト内パス）
 */
export function sanitizeRedirectPath(value: string | null | undefined): string {
    if (!value || hasControlCharacter(value)) return DEFAULT_REDIRECT_PATH

    // `//evil.example.com` や `/\evil.example.com` はプロトコル相対URLとして
    // 外部サイトへ遷移してしまうため、`/` 始まりかつ2文字目が区切りでないことを要求する
    if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) {
        return DEFAULT_REDIRECT_PATH
    }

    let parsed: URL
    try {
        // ダミーオリジンで解決し、オリジンが変化しない＝外部URLでないことを確認する
        parsed = new URL(value, DUMMY_ORIGIN)
    } catch {
        return DEFAULT_REDIRECT_PATH
    }
    if (parsed.origin !== DUMMY_ORIGIN) return DEFAULT_REDIRECT_PATH

    const isExcluded = EXCLUDED_REDIRECT_PREFIXES.some(
        (prefix) => parsed.pathname === prefix || parsed.pathname.startsWith(`${prefix}/`)
    )
    if (isExcluded) return DEFAULT_REDIRECT_PATH

    return `${parsed.pathname}${parsed.search}${parsed.hash}`
}

/**
 * 復帰先を `redirect_to` に載せたログイン画面のパスを組み立てる。
 *
 * proxy（`src/proxy.ts`）のサーバー側リダイレクトと挙動を揃えるため、
 * クライアント側の認証チェックから遷移する場合もこれを使う。
 *
 * @param returnPath ログイン後に戻したいパス（`usePathname()` の値など）
 * @returns `redirect_to` 付きのログイン画面パス。戻す意味が無い場合はクエリなしの {@link LOGIN_PATH}
 */
export function buildLoginPath(returnPath: string | null | undefined): string {
    const sanitized = sanitizeRedirectPath(returnPath)
    // フォールバック値＝ログイン後の既定の遷移先なので、わざわざクエリに載せない
    if (sanitized === DEFAULT_REDIRECT_PATH) return LOGIN_PATH
    return `${LOGIN_PATH}?${new URLSearchParams({ redirect_to: sanitized }).toString()}`
}
