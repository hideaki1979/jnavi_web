import { ResultToppingCall } from "@/types/ToppingCall";
import { Checkbox, FormControl, FormControlLabel, FormGroup, Typography } from "@mui/material";

interface StoreRegisterToppingCallsCheckProps {
    toppingOptions: Record<number, ResultToppingCall>;
    selectedOption: Record<number, number[]>
    onOptionChange: (toppingId: number, optionId: number, isChecked: boolean) => void;
    callType: "pre_call" | "post_call"
}

/**
 * 店舗登録時のトッピングコール選択・管理コンポーネント。
 * - トッピングコールの選択・状態管理
 *
 * @param toppingOptions - トッピングコールの情報
 * @param selectedOption - 選択されたトッピングコールの情報
 * @param onOptionChange - 選択されたトッピングコールの状態が変更されたときのハンドラ関数
 * @param callType - トッピングコールの種類（pre_call, post_call）
 * @returns - トッピングコール選択・管理コンポーネント
 */
export function StoreRegisterToppingCallsCheck({
    toppingOptions,
    selectedOption = {},
    onOptionChange,
    callType
}: StoreRegisterToppingCallsCheckProps) {
    return (
        <div className="space-y-4 space-x-6">
            {Object.values(toppingOptions).map(({ topping, call_options }) => (
                <FormControl key={`${callType}-${topping.id}`} className="mt-4">
                    <Typography variant="subtitle1" component="fieldset" className="font-bold text-gray-800">
                        {topping.topping_name}
                    </Typography>
                    <FormGroup
                        className="grid grid-cols-3"
                    >
                        {call_options.map(option => (
                            <FormControlLabel
                                key={option.id}
                                control={
                                    <Checkbox
                                        checked={(selectedOption[topping.id] || []).includes(option.id)}
                                        onChange={(_, checked) =>
                                            onOptionChange(topping.id, option.id, checked)
                                        }
                                        color="primary"
                                    />
                                }
                                label={
                                    <Typography variant="body2" className="text-gray-800">{option.call_option_name}</Typography>
                                }
                            />
                        ))}
                    </FormGroup>
                </FormControl>
            ))
            }
        </div>
    )
}