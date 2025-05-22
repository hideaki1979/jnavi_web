import { BaseToppingCall } from "@/types/ToppingCall";

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