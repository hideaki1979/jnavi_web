import { SelectedToppingInfo } from "@/types/Image";
import { SimulationToppingOption } from "@/types/ToppingCall";
import { Box, FormControl, FormControlLabel, FormLabel, Radio, RadioGroup } from "@mui/material";

interface ToppingOptionRadioSelectorProps {
    options: SimulationToppingOption[];
    selectedOptions: Record<string, SelectedToppingInfo>;
    onOptionChange: (toppingId: string, optionId: string, storeToppingCallId: string) => void;
}

/**
 * トッピングオプション選択用ラジオボタンコンポーネント。
 *
 * - `options`: トッピングオプションの配列
 * - `selectedOptions`: 選択されたトッピングオプション情報のハッシュ
 * - `onOptionChange`: 選択されたトッピングオプションが変更されたときのコールバック
 *
 * 以下の要素を返す:
 * - 1つのトッピングに対して1つの`FormControl`を生成
 * - 1つの`FormControl`に対して1つの`FormLabel`と1つの`RadioGroup`を生成
 * - `RadioGroup`にはトッピングの各オプションに対して1つの`FormControlLabel`を生成
 * - 選択されたトッピングオプションが変更されたとき、`onOptionChange`をコールバック
 */
export function ToppingOptionRadioSelector({
    options,
    selectedOptions,
    onOptionChange
}: ToppingOptionRadioSelectorProps) {
    if (!options.length) return null

    return (
        <Box>
            {options.map(option => (
                <FormControl
                    key={option.toppingId} component="fieldset" fullWidth className="mb-4"
                >
                    <FormLabel
                        component="legend"
                        sx={(theme) => ({
                            color: theme.palette.text.primary,
                            fontWeight: "bold",
                        })}
                    >
                        {option.toppingName}
                    </FormLabel>
                    <RadioGroup
                        row
                        value={selectedOptions[option.toppingId]?.optionId || ""}
                        onChange={(_, value) => {
                            const selected = option.options.find(opt => String(opt.optionId) === value)
                            if (selected) {
                                onOptionChange(
                                    String(option.toppingId),
                                    String(selected.optionId),
                                    String(selected.storeToppingCallId ?? "")
                                )
                            }
                        }}
                    >
                        {option.options.map(opt => (
                            <FormControlLabel
                                key={opt.optionId}
                                value={String(opt.optionId)}
                                control={<Radio color="primary" />}
                                label={opt.optionName}
                                sx={(theme) => ({ color: theme.palette.text.primary })}
                            />
                        ))}
                    </RadioGroup>
                </FormControl>
            ))}
        </Box>
    )
}