import { Box, List, ListItem, Typography } from "@mui/material";

/**
 * バリデーションエラーのリスト表示コンポーネント。
 * - エラー配列をリスト形式で表示
 */

interface ValidationErrorListProps {
    errors?: { msg: string; param?: string }[];
}

export function ValidationErrorList({ errors }: ValidationErrorListProps) {
    if (!errors || errors.length === 0) return null

    return (
        <Box mt={2}>
            <Typography color="error" variant="body2" fontWeight="bold">
                エラー詳細：
            </Typography>
            <List dense>
                {errors.map((err, idx) => (
                    <ListItem key={idx} sx={{ color: "error.main", pl: 0 }}>
                        {err.param ? `[${err.param}]` : ''}
                        {err.msg}
                    </ListItem>
                ))}
            </List>
        </Box>
    )
}