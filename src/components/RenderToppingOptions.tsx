import { Box, Chip, Typography } from "@mui/material"

export function RenderToppingOptions(options?: Record<string, string[]>) {
    if (!options) return null
    return Object.entries(options).map(([toppingName, optionList]) => (
        <Box key={toppingName} display="flex" alignItems="flex-start" flexDirection="column" mb={2}>
            <Typography variant="body2" fontWeight="bold" mb={1}>
                {toppingName}：
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1}>
                {optionList.map((option, idx) => (
                    <Chip
                        key={option + idx}
                        label={option}
                        size="small"
                        color="primary"
                        variant="outlined"
                    />
                ))}
            </Box>
        </Box>
    ))
}