import { SimulationToppingOption } from "@/types/ToppingCall";

/**
 * トッピング選択からコールテキストを生成するフォーマッター。
 * - generateCallText: 選択されたトッピングオプションからコールテキストを生成
 */

/**
 * コールテキストを生成（precall, postcall用）
 */
export function generateCallText(
    selectedOptions: Record<string, string>,
    toppingOptions: SimulationToppingOption[]
): string {
    return toppingOptions.map(option => {
        const selectedOptionId = selectedOptions[option.toppingId]
        if (!selectedOptionId) return null

        const selectedOption = option.options.find(
            opt => String(opt.optionId) === selectedOptionId
        )
        if (!selectedOption) return null

        // 麺の硬さ（ID：5）、または麺量（ID: 6）
        if (option.toppingId == 5 || option.toppingId == 6)
            return `麺${selectedOption.optionName}`

        if (selectedOption.optionName === "ちょいマシ")
            return option.toppingName
        return `${option.toppingName}${selectedOption.optionName}`
    })
        .filter(Boolean)
        .join('\n')
}