import { ApiClientError, ExpressValidationError } from "@/types/validation";
import { useState } from "react";

interface UseApiErrorReturn {
    errorMessage: string | null;
    validationErrors: ExpressValidationError[];
    setError: (error: unknown) => void;
    clearErrors: () => void;
}

/**
 * API エラーハンドリング用カスタムフック
 * - 一般的なエラーメッセージとexpress-validationのエラー情報を管理
 * - バリデーションエラーの表示に使用
 */
export function useApiError(): UseApiErrorReturn {
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [validationErrors, setValidationErrors] = useState<ExpressValidationError[]>([])

    const setError = (error: unknown) => {
        if (error && typeof error === 'object' && 'errors' in error) {
            const apiError = error as ApiClientError
            setErrorMessage(apiError.message || '予期せぬエラーが発生しました。')

            // express-validationのエラー配列があればセット
            if (apiError.errors && Array.isArray(apiError.errors)) {
                setValidationErrors(apiError.errors)
            } else {
                setValidationErrors([])
            }
        } else if (error instanceof Error) {
            setErrorMessage(error.message)
            setValidationErrors([])
        } else {
            setErrorMessage('予期せぬエラーが発生しました。')
            setValidationErrors([])
        }

    }

    const clearErrors = () => {
        setErrorMessage(null)
        setValidationErrors([])
    }

    return {
        errorMessage,
        validationErrors,
        setError,
        clearErrors
    }
}