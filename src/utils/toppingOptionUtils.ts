import { FormattedToppingOptionIds } from "@/types/ToppingCall"

/**
 * トッピングオプションの状態管理ユーティリティ。
 * - updateToppingOption: トッピングオプションの追加・削除
 * - createToppingOptionHandler: ハンドラー関数を生成するヘルパー
 */

/**
 * トッピングオプションの選択状態をイミュータブルに更新します。
 *
 * 指定されたトッピングIDとオプションIDに基づき、チェック状態に応じて
 * 新しい状態オブジェクトを生成して返します。
 *
 * @param {FormattedToppingOptionIds} prevState - 更新前の状態オブジェクト。
 * @param {number} toppingId - 更新対象のトッピングID。
 * @param {number} optionId - 更新対象のオプションID。
 * @param {boolean} isChecked - `true`の場合オプションを追加、`false`の場合削除します。
 * @returns {FormattedToppingOptionIds} 更新後の新しい状態オブジェクト。
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
