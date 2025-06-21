import { useCallback, useState } from "react"

/**
 * 非同期処理の状態（ローディング、エラー、データ）を管理するカスタムフック
 * @template T - 非同期処理が解決するデータの型
 * @returns {object} - isLoading, error, data, execute, reset
 */
export function useAsyncOperation<T = void>() {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [data, setData] = useState<T | null>(null)

    /**
 * 非同期処理を実行する関数
 * @param {() => Promise<T>} operation - 実行する非同期関数
 * @returns {Promise<T>} - 非同期処理の結果を返すPromise
 */
    const execute = useCallback(async (operation: () => Promise<T>): Promise<T> => {
        setIsLoading(true)
        setError(null)
        try {
            const result = await operation()
            setData(result)
            return result
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "予期せぬエラーが発生しました"
            setError(errorMessage)
            // エラーを呼び出し元に伝播させるために再スローする
            throw err
        } finally {
            setIsLoading(false)
        }
    }, [])

    /**
   * 状態を初期値にリセットする関数
   */
    const reset = useCallback(() => {
        setIsLoading(false)
        setError(null)
        setData(null)
    }, [])
    return { isLoading, error, data, execute, reset }
}