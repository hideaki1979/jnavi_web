import { FormattedToppingOptionIds } from "@/types/ToppingCall"

/**
 * トッピングオプションの状態管理ユーティリティ。
 * - updateToppingOption: トッピングオプションの追加・削除
 * - createToppingOptionHandler: ハンドラー関数を生成するヘルパー
 */

export const updateToppingOption = (
    prevState: FormattedToppingOptionIds,
    toppingId: number,
    optionId: number,
    isChecked: boolean
): FormattedToppingOptionIds => {
    const currentOptions = [...(prevState[toppingId] || [])]

    if (isChecked) {
        // オプション追加
        if (!currentOptions.includes(optionId)) {
            return {
                ...prevState,
                [toppingId]: [...currentOptions, optionId]
            }
        }
    } else {
        // オプション削除
        return {
            ...prevState,
            [toppingId]: currentOptions.filter(id => id !== optionId)
        }
    }

    return prevState
}

/**
 * ハンドラー関数を生成するヘルパー関数
 */
export const createToppingOptionHandler = (
    setter: React.Dispatch<React.SetStateAction<FormattedToppingOptionIds>>
) => (toppingId: number, optionId: number, isChecked: boolean) => {
    setter(prev => updateToppingOption(prev, toppingId, optionId, isChecked))
}
