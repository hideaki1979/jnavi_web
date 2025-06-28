'use client'

import { SelectedToppingInfoMap, SimulationToppingOption } from "@/types/ToppingCall";
import { ExpressValidationError } from "@/types/validation";
import { ImageEditFormValues, ImageUploadFormValues } from "@/validations/image";
import { Box, Button, CircularProgress, Divider, FormControl, InputLabel, MenuItem, Select, TextField, Typography } from "@mui/material";
import Image from "next/image";
import { Control, Controller, FieldErrors } from "react-hook-form";
import { ToppingOptionRadioSelector } from "../toppingCallOptions/ToppingOptionRadioSelector";
import { ValidationErrorList } from "../feedback/validationErrorList";

const MENU_TYPE = [
    { label: "通常メニュー", value: "1" },
    { label: "限定メニュー", value: "2" }
]

type ImageFormValues = ImageUploadFormValues | ImageEditFormValues

interface StoreImageFormProps {
    mode: 'create' | 'edit';
    formTitle: string;
    imageUrl: string;
    onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onImageRemove: () => void;
    control: Control<ImageFormValues>;
    errors: FieldErrors<ImageFormValues>;
    toppingOptions: SimulationToppingOption[];
    selectedToppingInfo: SelectedToppingInfoMap;
    onToppingChange: (toppingId: string, optionId: string, storeToppingCallId: string) => void;
    errorMessage: string | null;
    validationErrors: ExpressValidationError[];
    submitButtonLabel: string;
    isSubmitting: boolean;
    onSubmit: () => void;
}

/**
 * 店舗画像フォーム共通コンポーネント
 * 画像アップロード・編集画面で共通使用
 */
export function StoreImageForm({
    mode,
    formTitle,
    imageUrl,
    onImageChange,
    onImageRemove,
    control,
    errors,
    toppingOptions,
    selectedToppingInfo,
    onToppingChange,
    validationErrors,
    submitButtonLabel,
    isSubmitting,
    onSubmit,
}: StoreImageFormProps) {
    return (
        <form
            onSubmit={onSubmit}
            className="border border-gray-300 shadow-md mx-auto rounded-md p-4 max-w-xl w-full bg-gray-200 text-slate-800"
        >
            <Typography variant="h5" fontWeight="bold" className="my-8 text-center">
                {formTitle}
            </Typography>

            {/* 画像選択 */}
            <Box display="flex" flexDirection="column" alignItems="center">
                {imageUrl ? (
                    <Box width="100%" display="flex" flexDirection="column" alignItems="center" mb={2}>
                        <Box position="relative" width="280px" height="160px" className="rounded-md mb-4 overflow-hidden">
                            <Image
                                src={imageUrl}
                                alt="選択したラーメン画像"
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                style={{ objectFit: "contain" }}
                                priority
                            />
                        </Box>
                        <Button variant="outlined" color="secondary" onClick={onImageRemove}>
                            画像を削除
                        </Button>
                    </Box>
                ) : (
                    <label htmlFor={`image-${mode}-input`}>
                        <Button
                            variant={mode === 'create' ? 'contained' : 'outlined'}
                            color="primary"
                            component="span"
                            className="w-full mb-2"
                        >
                            画像を{mode === 'create' ? '選択' : '変更'}
                            <input
                                id={`image-${mode}-input`}
                                type="file"
                                accept="image/jpeg,image/png,image/gif,image/webp"
                                hidden
                                onChange={onImageChange}
                            />
                        </Button>
                    </label>
                )}
                {errors.imageFile && (
                    <Typography color="error" variant='body2' className='mt-2'>
                        {errors.imageFile.message}
                    </Typography>
                )}
            </Box>
            <Divider className="my-4" />
            {/* メニュー情報 */}
            <Typography variant="subtitle1" fontWeight="bold" mb={4}>
                メニュー情報
            </Typography>
            <Box mb={2}>
                <Controller
                    name="menuType" control={control}
                    render={({ field }) => (
                        <FormControl fullWidth size="small" required>
                            <InputLabel
                                id="menu-type-label"
                            >メニュータイプ
                            </InputLabel>
                            <Select
                                {...field}
                                labelId="menu-type-label"
                                id="menu-type"
                                label="メニュータイプ"
                                fullWidth
                                className="mb-4"
                            >
                                {MENU_TYPE.map(menu => (
                                    <MenuItem key={menu.value} value={menu.value}>
                                        {menu.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}
                />
                <Controller
                    name="menuName"
                    control={control}

                    render={({ field }) => (
                        <TextField
                            label="メニュー名" {...field} placeholder="小ラーメン"
                            fullWidth className="mb-4" error={!!errors.menuName}
                            helperText={errors.menuName?.message} size="small"
                        />
                    )}
                />
            </Box>
            {/* トッピングオプション */}
            {toppingOptions.length > 0 && (
                <>
                    <Typography variant="subtitle1" fontWeight="bold" className="mb-4">
                        トッピングコールオプション
                    </Typography>
                    <ToppingOptionRadioSelector
                        options={toppingOptions}
                        selectedOptions={selectedToppingInfo}
                        onOptionChange={onToppingChange}
                    />
                </>
            )}

            {/* バリデーションエラー表示 */}
            <ValidationErrorList errors={validationErrors} />

            {/* アップロードボタン */}
            <Box display="flex" justifyContent="center" mt={6}>
                <Button
                    variant="contained"
                    color="primary"
                    type="submit"
                    disabled={isSubmitting}
                    className="w-2/3 font-bold py-2"
                >
                    {isSubmitting ? <CircularProgress size={24} color="inherit" /> : submitButtonLabel}
                </Button>
            </Box>
        </form>
    )
}