import { SimulationToppingOption } from "@/types/ToppingCall";
import { Box, FormControl, FormControlLabel, FormLabel, Radio, RadioGroup } from "@mui/material";

interface ToppingOptionSelectorProps {
    options: SimulationToppingOption[];
    selectedOptions: Record<string, string>;
    onOptionChange: (toppingId: string, optionId: string) => void;
}

/**
 * トッピングオプションの選択を管理するコンポーネント。
 * 
 * - トッピングごとにラジオボタンを表示し、選択したオプションを管理。
 * - 選択されたオプションは `selectedOptions` に基づいて表示される。
 * - オプションが選択されると `onOptionChange` コールバックが呼び出される。
 * 
 * @param {SimulationToppingOption[]} options - トッピングオプションの配列。
 * @param {Record<string, string>} selectedOptions - 選択されたトッピングオプションを示す記録。
 * @param {Function} onOptionChange - オプションが選択されたときに呼び出されるコールバック関数。
 */

export function ToppingOptionSelector({ options, selectedOptions, onOptionChange }: ToppingOptionSelectorProps) {

    if (!options.length) return null

    return (
        <Box>
            {options.map((option) => (
                <FormControl key={option.toppingId} component="fieldset" fullWidth className="mb-4">
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
                        value={selectedOptions[option.toppingId] || ""}
                        onChange={(_, value) => onOptionChange(String(option.toppingId), value)}
                    >
                        {option.options.map((opt) => (
                            <FormControlLabel
                                key={opt.optionId}
                                value={opt.optionId}
                                control={
                                    <Radio color="primary" />
                                }
                                label={opt.optionName}
                                sx={(theme) => ({
                                    color: theme.palette.text.primary
                                })}
                            />
                        ))}
                    </RadioGroup>
                </FormControl>
            ))}
        </Box>
    )
}