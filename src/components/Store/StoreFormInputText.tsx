/**
 * 店舗情報フォーム用のテキスト入力コンポーネント。
 * - バリデーション・エラー表示等
 */
import { StoreFormInput } from "@/validations/store";
import { countTextLength } from "@/utils/textLength";
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
    maxLength?: number;
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
 * - `maxLength`を指定すると入力可能な文字数を制限し、文字数カウンタを表示します。
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
    rows = 1,
    maxLength

}: StoreFormInputProps) => {
    return (
        <Controller
            name={name}
            control={control}
            render={({ field }) => {
                const errorMessage = errors[name]?.message as string | undefined
                // 文字数カウンタはサーバと同一基準（countTextLength）で数える。
                // String.prototype.length では絵文字を2文字として数えてしまうため使用しない
                const currentLength = countTextLength(String(field.value ?? ""))

                return (
                    <TextField
                        {...field}
                        label={label}
                        fullWidth
                        required={required}
                        error={!!errors[name]}
                        helperText={errorMessage ?? (maxLength ? `${currentLength}/${maxLength}` : undefined)}
                        margin={margin}
                        size={size}
                        slotProps={{
                            input: {
                                ...(startAdornment ? {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            {startAdornment}
                                        </InputAdornment>
                                    )
                                } : {}),
                                inputProps: {
                                    className: "text-sm",
                                    ...(maxLength ? { maxLength } : {})
                                }
                            },
                            formHelperText: {
                                // 文字数カウンタは右寄せ、エラーメッセージは通常表示
                                sx: errorMessage ? undefined : { textAlign: "right" }
                            }
                        }}
                        multiline={multiline}
                        rows={rows}
                    />
                )
            }}
        />
    )
}
