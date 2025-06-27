"use client"

import { BaseToppingCall, FormattedToppingOptionIds, ResultToppingCall } from "@/types/ToppingCall";
import { StoreFormInput, StoreInputSchema } from "@/validations/store";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Control, FieldErrors, useForm, UseFormHandleSubmit, UseFormReset } from "react-hook-form";
import { useApiError } from "./useApiError";
import { zodResolver } from "@hookform/resolvers/zod";
import { formattedToppingCalls } from "@/lib/toppingCallFormatter";
import { ExpressValidationError } from "@/types/validation";

interface UseStoreFormOptions {
    mode: 'create' | 'edit';
    initialData?: Partial<StoreFormInput> & {
        preCallFormattedIds?: FormattedToppingOptionIds;
        postCallFormattedIds?: FormattedToppingOptionIds;
    },
    toppingOptions: Record<number, ResultToppingCall>;
}

interface UseStoreFormReturn {
    // React-Hook-Form
    control: Control<StoreFormInput>
    handleSubmit: UseFormHandleSubmit<StoreFormInput>;
    errors: FieldErrors<StoreFormInput>;
    reset: UseFormReset<StoreFormInput>;

    // トッピングコール
    toppingOptionData: Record<number, ResultToppingCall>;
    selectedPreCallOptions: FormattedToppingOptionIds;
    selectedPostCallOptions: FormattedToppingOptionIds;
    handleChangePreCallOptionCheck: (toppingId: number, optionId: number, checked: boolean) => void;
    handleChangePostCallOptionCheck: (toppingId: number, optionId: number, checked: boolean) => void;

    // エラーハンドリング
    errorMessage: string | null;
    validationErrors: ExpressValidationError[]
    setError: (error: unknown) => void;
    clearErrors: () => void;

    // 送信データ生成
    createSubmitData: (formData: StoreFormInput) => StoreFormInput & { topping_calls: BaseToppingCall[] }
}

/**
 * 店舗登録・編集画面フォームの状態管理Hook。
 *
 * - modeに応じて、店舗登録・編集のどちらかを実行
 * - initialDataに基づいて、フォームの初期値を設定
 * - トッピングコールの選択状態を管理
 * - react-hook-formを使用して、フォームのバリデーションを実行
 * - 送信データ生成関数を提供
 *
 * @param {{ mode: 'create' | 'edit', initialData?: Partial<StoreFormInput>, toppingOptions: Record<number, ResultToppingCall> }} options
 * @returns {UseStoreFormReturn} 共通化されたフォーム状態管理インターフェース
 */

export function useStoreForm(
    { mode, initialData, toppingOptions }: UseStoreFormOptions
): UseStoreFormReturn {
    // トッピングコール関連の状態
    const [toppingOptionData, setToppingOptionData] = useState<Record<number, ResultToppingCall>>({})
    const [selectedPreCallOptions, setSelectedPreCallOptions] = useState<FormattedToppingOptionIds>({})
    const [selectedPostCallOptions, setSelectedPostCallOptions] = useState<FormattedToppingOptionIds>({})

    // APIエラーハンドリング
    const { errorMessage, validationErrors, setError, clearErrors } = useApiError()

    // フォームデフォルト値設定（useMemoでラップ）
    const defaultValues = useMemo<StoreFormInput>(() => {
        const {
            store_name = "",
            branch_name = "",
            address = "",
            business_hours = "",
            regular_holidays = "",
            prior_meal_voucher = false,
            is_all_increased = false,
            is_lot = false,
            topping_details = "",
            call_details = "",
            lot_detail = ""
        } = initialData || {}

        return {
            store_name,
            branch_name,
            address,
            business_hours,
            regular_holidays,
            prior_meal_voucher,
            is_all_increased,
            is_lot,
            topping_details,
            call_details,
            lot_detail
        }
    }, [initialData])

    // react-hook-form設定
    const { control, handleSubmit, formState: { errors }, reset } = useForm<StoreFormInput>({
        resolver: zodResolver(StoreInputSchema),
        defaultValues
    })

    // initialDataが変更されたらフォームと状態をリセットする
    useEffect(() => {
        if (initialData) {
            // フォームの値をリセット
            reset(defaultValues);

            // トッピングコールの選択状態をリセット
            const initSelectedOptions: FormattedToppingOptionIds = {};
            if (toppingOptionData && Object.keys(toppingOptionData).length > 0) {
                Object.keys(toppingOptionData).forEach(key => {
                    initSelectedOptions[Number(key)] = [];
                });
                setSelectedPreCallOptions(initialData.preCallFormattedIds || { ...initSelectedOptions });
                setSelectedPostCallOptions(initialData.postCallFormattedIds || { ...initSelectedOptions });
            }
        }
    }, [initialData, defaultValues, reset, toppingOptionData]);

    // ハンドラー関数を生成
    const handleChangePreCallOptionCheck = useCallback(
        (toppingId: number, optionId: number, isChecked: boolean) => {
            setSelectedPreCallOptions(prev => {
                const currentOptions = [...(prev[toppingId] || [])]

                if (isChecked) {
                    // オプション追加
                    if (!currentOptions.includes(optionId)) {
                        return {
                            ...prev,
                            [toppingId]: [...currentOptions, optionId]
                        }
                    }
                } else {
                    // オプション削除
                    return {
                        ...prev,
                        [toppingId]: currentOptions.filter(id => id !== optionId)
                    }
                }
                return prev
            })
        },
        []
    )

    const handleChangePostCallOptionCheck = useCallback(
        (toppingId: number, optionId: number, isChecked: boolean) => {
            setSelectedPostCallOptions(prev => {
                const currentOptions = [...(prev[toppingId] || [])]

                if (isChecked) {
                    // オプション追加
                    if (!currentOptions.includes(optionId)) {
                        return {
                            ...prev,
                            [toppingId]: [...currentOptions, optionId]
                        }
                    }
                } else {
                    // オプション削除
                    return {
                        ...prev,
                        [toppingId]: currentOptions.filter(id => id !== optionId)
                    }
                }
                return prev
            })
        },
        []
    )

    // トッピングコール情報の初期化
    useEffect(() => {
        if (!toppingOptions) return

        setToppingOptionData(toppingOptions)

        // 作成モードの場合、トッピングを空で初期化
        if (mode === 'create') {
            const initSelectedOptions: FormattedToppingOptionIds = {}
            Object.keys(toppingOptions).forEach(key => {
                initSelectedOptions[Number(key)] = []
            })
            setSelectedPreCallOptions({ ...initSelectedOptions })
            setSelectedPostCallOptions({ ...initSelectedOptions })
        }
    }, [toppingOptions, mode])

    // 送信データ生成関数
    const createSubmitData = useCallback((formData: StoreFormInput) => {
        const preCallsData = formattedToppingCalls(selectedPreCallOptions, "pre_call")
        const postCallsData = formattedToppingCalls(selectedPostCallOptions, "post_call")
        const toppingCallData = [...preCallsData, ...postCallsData]

        return {
            ...formData,
            topping_calls: toppingCallData
        }
    }, [selectedPostCallOptions, selectedPreCallOptions])

    return {
        // react-hook-form
        control,
        handleSubmit,
        errors,
        reset,

        // トッピングコール状態
        toppingOptionData,
        selectedPreCallOptions,
        selectedPostCallOptions,
        handleChangePreCallOptionCheck,
        handleChangePostCallOptionCheck,

        // エラーハンドリング
        errorMessage,
        validationErrors,
        setError,
        clearErrors,

        // 送信データ生成
        createSubmitData
    }
}