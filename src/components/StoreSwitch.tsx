/**
 * 店舗情報のON/OFF切替用スイッチコンポーネント。
 * - 店舗の有効/無効状態を切り替え
 */
import { StoreFormInput } from "@/validations/store"
import { FormControlLabel, Switch } from "@mui/material";
import { Control, Controller } from "react-hook-form";

type StoreSwitchProps = {
    name: keyof StoreFormInput;
    control: Control<StoreFormInput>;
    label: string;
}

/**
 * 店舗情報のON/OFF切替用スイッチコンポーネントを提供します。
 *
 * @param {keyof StoreFormInput} name react-hook-formのフィールド名
 * @param {Control<StoreFormInput>} control react-hook-formのコントロール
 * @param {string} label スイッチのラベル
 * @returns ON/OFFスイッチコンポーネント
 */
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
