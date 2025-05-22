import { StoreFormInput } from "@/validations/store"
import { FormControlLabel, Switch } from "@mui/material";
import { Control, Controller } from "react-hook-form";

type StoreSwitchProps = {
    name: keyof StoreFormInput;
    control: Control<StoreFormInput>;
    label: string;
}

export default function StoreSwitch({
    name,
    control,
    label
}: StoreSwitchProps) {
    return (
        <Controller
            name={name}
            control={control}
            render={({ field }) => (
                <FormControlLabel
                    control={
                        <Switch
                            checked={Boolean(field.value)}
                            onChange={(_, checked) => field.onChange(checked)}
                            color="primary"
                        />}
                    className="w-full"
                    label={<span className="text-sm">{label}</span>}

                />
            )}
        />
    )
}
