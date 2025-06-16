import { useEffect, useState } from "react";

/**
 * デバウンス機能を提供するカスタムフック
 * 
 * @param value デバウンスしたい値
 * @param delay 遅延時間（ミリ秒）
 * @returns デバウンスされた値
 */
export function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value)

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value)
        }, delay)

        // クリーンアップ関数
        return () => {
            clearTimeout(handler)
        }
    }, [value, delay])

    return debouncedValue
} 