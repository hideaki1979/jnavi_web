import { SelectedToppingInfo } from "@/types/Image";
import { SimulationToppingOption } from "@/types/ToppingCall";
import { Box, FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, useTheme } from "@mui/material";

interface ToppingOptionRadioSelectorProps {
    options: SimulationToppingOption[];
    selectedOptions: Record<string, SelectedToppingInfo>;
    onOptionChange: (toppingId: string, optionId: string, storeToppingCallId: string) => void;
}

export function ToppingOptionRadioSelector({
    options,
    selectedOptions,
    onOptionChange
}: ToppingOptionRadioSelectorProps) {
    const theme = useTheme()
    if (!options.length) return null

    return (
        <Box>
            {options.map(option => (
                <FormControl
                    key={option.toppingId} component="fieldset" fullWidth className="mb-4"
                >
                    <FormLabel
                        component="legend"
                        sx={{
                            color: theme.palette.text.primary,
                            fontWeight: "bold",
                        }}
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
                                sx={{ color: theme.palette.text.primary }}
                            />
                        ))}
                    </RadioGroup>
                </FormControl>
            ))}
        </Box>
    )
}