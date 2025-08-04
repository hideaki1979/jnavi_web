import { FormattedToppingOptionNames } from "@/types/ToppingCall"
import { Box, Chip, Typography } from "@mui/material"

/**
 * トッピングの名称と選択されたオプションのリストをプロパティに取り、チップ状に表示するコンポーネント。
 * - options: トッピングの名称と選択されたオプションのハッシュ
 *          {
 *              "toppingName1": ["optionName1", "optionName2", ...],
 *              "toppingName2": ["optionName3", "optionName4", ...],
 *              ...
 *          }
 */
export function RenderToppingOptions(options?: FormattedToppingOptionNames) {
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
                    />
                ))}
            </Box>
        </Box>
    ))
}