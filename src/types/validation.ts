// express-validationのエラー型定義
export interface ExpressValidationError {
    msg: string;
    param?: string;
    location?: string;
    value?: unknown;
}

export interface ApiErrorResponse {
    status?: string;
    message?: string;
    errors?: ExpressValidationError[];
}

// カスタムエラー型
export interface ApiClientError extends Error {
    errors?: ExpressValidationError[]
}