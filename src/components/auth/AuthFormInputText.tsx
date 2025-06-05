import { Visibility, VisibilityOff } from "@mui/icons-material";
import { IconButton, InputAdornment, TextField } from "@mui/material";
import { ReactNode, useState } from "react";
import { Control, Controller, FieldErrors, FieldValues, Path } from "react-hook-form";

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