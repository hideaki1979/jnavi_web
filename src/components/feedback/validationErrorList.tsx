import { ExpressValidationError } from "@/types/validation";
import { Box, List, ListItem, Typography } from "@mui/material";

/**
 * バリデーションエラーのリスト表示コンポーネント。
 * - エラー配列をリスト形式で表示
 */

interface ValidationErrorListProps {
    errors?: ExpressValidationError[];
}

/**
 * エラー項目からフィールド名を取得する。
 * express-validator v7 は `path`、v6 以前は `param` にフィールド名を持つ。
 */
const getFieldName = (err: ExpressValidationError): string | undefined =>
    err.path ?? err.param

export function ValidationErrorList({ errors }: ValidationErrorListProps) {
    if (!errors || errors.length === 0) return null

    // 同一フィールドで同じメッセージが重複することがあるため除外する
    // （必須項目は trim 前後で notEmpty を2回検証するため、空文字送信時に重複する）
    const uniqueErrors = errors.filter((err, idx, arr) =>
        arr.findIndex(e => getFieldName(e) === getFieldName(err) && e.msg === err.msg) === idx
    )

    return (
        <Box mt={2}>
            <Typography color="error" variant="body2" fontWeight="bold">
                エラー詳細：
            </Typography>
            <List dense>
                {uniqueErrors.map((err, idx) => {
                    const fieldName = getFieldName(err)
                    return (
                        <ListItem key={`${fieldName ?? 'error'}-${idx}`} sx={{ color: "error.main", pl: 0 }}>
                            {fieldName ? `[${fieldName}]` : ''}
                            {err.msg}
                        </ListItem>
                    )
                })}
            </List>
        </Box>
    )
}
