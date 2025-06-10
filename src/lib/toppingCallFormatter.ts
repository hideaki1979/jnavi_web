import { BaseToppingCall } from "@/types/ToppingCall";

/**
 * トッピングコール情報をAPIリクエスト用の形式に変換するフォーマッター。
 * - formattedToppingCalls: 選択されたトッピングオプションをBaseToppingCall形式に変換
 */
export const formattedToppingCalls = (
    selectedToppingOptions: Record<number, number[]>,
    callTiming: "pre_call" | "post_call" = "pre_call"
): BaseToppingCall[] => {
    if (!selectedToppingOptions) return []
    return Object.entries(selectedToppingOptions).flatMap(([toppingIdStr, optionIds]) =>
        optionIds.map(optionId => ({
            topping_id: Number(toppingIdStr),
            call_option_id: optionId,
            call_timing: callTiming,
            noodle_type_id: 1
        }))
    )
}