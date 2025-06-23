/**
 * 店舗情報フォーム用のテキスト入力コンポーネント。
 * - バリデーション・エラー表示等
 */
import { StoreFormInput } from "@/validations/store";
import { InputAdornment, TextField } from "@mui/material"
import { ReactNode } from "react";
import { Control, Controller, FieldErrors } from "react-hook-form"

type StoreFormInputProps = {
    name: keyof StoreFormInput;
    control: Control<StoreFormInput>;
    label: string;
    required?: boolean;
    errors: FieldErrors;
    margin: "none" | "dense" | "normal";
    size?: "small" | "medium";
    startAdornment?: ReactNode;
    multiline?: boolean;
    rows?: number;
}

/**
 * 店舗情報フォーム用のテキスト入力コンポーネント。
 *
 * - `name`で指定されたフィールドの値を状態として保持し、`control`を通じて
 *   react-hook-formのコントロールに紐づけます。
 * - `label`で指定されたラベルを表示します。
 * - `required`が`true`の場合、必須項目とする旨を表示します。
 * - `errors`に指定されたエラーメッセージを表示します。
 * - `margin`を指定して入力フィールドのマージンを設定します。
 * - `size`を指定して入力フィールドのサイズを設定します。
 * - `startAdornment`に指定された要素をテキストフィールドの開始位置に配置します。
 * - `multiline`が`true`の場合、テキストフィールドは複数行対応になります。
 * - `rows`で指定された行数分の高さを持つテキストフィールドを表示します。
 */

export const StoreFormInputText = ({
    name,
    control,
    label,
    required = false,
    errors,
    margin,
    size = "small",
    startAdornment,
    multiline = false,
    rows = 1

}: StoreFormInputProps) => {
    return (
        <Controller
            name={name}
            control={control}
            render={({ field }) => (
                <TextField
                    {...field}
                    label={label}
                    fullWidth
                    required={required}
                    error={!!errors[name]}
                    helperText={errors[name]?.message as string}
                    margin={margin}
                    size={size}
                    slotProps={startAdornment ? {
                        input: {
                            startAdornment: (
                                <InputAdornment position="start">
                                    {startAdornment}
                                </InputAdornment>
                            ),
                            inputProps: {
                                className: "text-sm"
                            }
                        },
                    } : {
                        input: {
                            inputProps: {
                                className: "text-sm"
                            }
                        }
                    }}
                    multiline={multiline}
                    rows={rows}
                />
            )}
        />
    )
} 