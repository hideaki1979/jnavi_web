// express-validatorのエラー型定義
// express-validator v7 はフィールド名を `path` で返す（v6 までの `param` は廃止）。
// 旧APIとの互換のため `param` も任意で残す。
export interface ExpressValidationError {
    type?: string;
    msg: string;
    path?: string;
    param?: string;
    location?: string;
    value?: unknown;
}

// APIのエラーレスポンス型定義
// バックエンドは { success: false, error: string, details?: [] } 形式を返す。
// `message` / `errors` は旧形式との互換のために残している。
export interface ApiErrorResponse {
    success?: boolean;
    error?: string;
    details?: ExpressValidationError[];
    status?: string;
    message?: string;
    errors?: ExpressValidationError[];
}

// カスタムエラー型
export interface ApiClientError extends Error {
    errors?: ExpressValidationError[]
}
