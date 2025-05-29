import { SimulationToppingOption } from "@/types/ToppingCall";
import { Box, FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, useTheme } from "@mui/material";

interface ToppingOptionSelectorProps {
    options: SimulationToppingOption[];
    selectedOptions: Record<string, string>;
    onOptionChange: (toppingId: string, optionId: string) => void;
}

export function ToppingOptionSelector({ options, selectedOptions, onOptionChange }: ToppingOptionSelectorProps) {
    const theme = useTheme()

    if (!options.length) return null

    return (
        <Box>
            {options.map((option) => (
                <FormControl key={option.toppingId} component="fieldset" fullWidth className="mb-4">
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
                                sx={{
                                    color: theme.palette.text.primary
                                }}
                            />
                        ))}
                    </RadioGroup>
                </FormControl>
            ))}
        </Box>
    )
}