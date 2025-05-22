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