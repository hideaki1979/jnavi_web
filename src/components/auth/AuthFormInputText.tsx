import { Visibility, VisibilityOff } from "@mui/icons-material";
import { IconButton, InputAdornment, TextField } from "@mui/material";
import { ReactNode, useState } from "react";
import { Control, Controller, FieldErrors, FieldValues, Path } from "react-hook-form";

/**
 * 認証フォーム用のテキスト入力コンポーネント。
 * - バリデーション・アイコン表示・パスワード表示切替等
 */

interface AuthFormInputProps<T extends FieldValues = FieldValues> {
    name: Path<T>;
    control: Control<T>;
    label: string;
    type?: string;
    required?: boolean;
    errors: FieldErrors<T>;
    startAdornment?: ReactNode;
    endAdornment?: ReactNode;
}

/**
 * 認証フォーム用のテキスト入力コンポーネント。
 *
 * - `name`で指定されたフィールドの値を状態として保持し、`control`を通じて
 *   react-hook-formのコントロールに紐づけます。
 * - `label`で指定されたラベルを表示します。
 * - `type`で指定された入力タイプに応じて、テキストフィールドの型を決定します。
 *   デフォルトは`text`型です。
 * - `required`が`true`の場合、必須項目とする旨を表示します。
 * - `errors`に指定されたエラーメッセージを表示します。
 * - `startAdornment`に指定された要素をテキストフィールドの開始位置に配置します。
 * - `endAdornment`に指定された要素をテキストフィールドの終了位置に配置します。
 *   ただし、`type`が`password`の場合、自動的にパスワード表示切り替えボタンを
 *   追加します。
 * @param name react-hook-formのフィールド名
 * @param control react-hook-formのコントロール
 * @param label 入力フィールドのラベル
 * @param type 入力タイプ
 * @param required 必須項目か否か
 * @param errors エラーメッセージ
 * @param startAdornment テキストフィールドの開始位置に配置する要素
 * @param endAdornment テキストフィールドの終了位置に配置する要素
 */
export function AuthFormInputText<T extends FieldValues = FieldValues>({
    name,
    control,
    label,
    type = "text",
    required = false,
    errors,
    startAdornment,
    endAdornment
}: AuthFormInputProps<T>) {
    const [showPassword, setShowPassword] = useState(false)
    const isPasswordField = type === "password"
    const inputType = isPasswordField ? (showPassword ? "text" : "password") : type

    /**
     * パスワード表示切り替えボタンがクリックされた時に実行されるハンドラ。
     *
     * 現在の状態を反転させ、パスワードを表示/非表示にします。
     */
    const handleClickShowPassword = () => {
        setShowPassword(!showPassword)
    }

    // パスワードフィールドの場合は自動的に表示切り替えボタンを追加
    const finalEndAdornment = isPasswordField ? (
        <InputAdornment position="end">
            <IconButton
                aria-label="toggle password visibility"
                onClick={handleClickShowPassword}
                edge="end"
                size="small"
            >
                {showPassword ? <VisibilityOff /> : <Visibility />}
            </IconButton>
        </InputAdornment>
    ) : endAdornment ? (
        <InputAdornment position="end">
            {endAdornment}
        </InputAdornment>
    ) : undefined

    return (
        <Controller
            name={name}
            control={control}
            render={({ field }) => (
                <TextField
                    {...field}
                    label={label}
                    type={inputType}
                    fullWidth
                    required={required}
                    error={!!errors[name]}
                    helperText={errors[name]?.message as string}
                    margin="normal"
                    size="small"
                    slotProps={{
                        input: {
                            startAdornment: startAdornment ? (
                                <InputAdornment position="start">
                                    {startAdornment}
                                </InputAdornment>
                            ) : undefined,
                            endAdornment: finalEndAdornment
                        }
                    }}
                />
            )}
        />
    )
}