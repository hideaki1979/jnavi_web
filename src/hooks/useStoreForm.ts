"use client"

import { BaseToppingCall, FormattedToppingOptionIds, ToppingOptionMap } from "@/types/ToppingCall";
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
    toppingOptions: ToppingOptionMap;
}

interface UseStoreFormReturn {
    // React-Hook-Form
    control: Control<StoreFormInput>
    handleSubmit: UseFormHandleSubmit<StoreFormInput>;
    errors: FieldErrors<StoreFormInput>;
    reset: UseFormReset<StoreFormInput>;

    // トッピングコール
    toppingOptionData: ToppingOptionMap;
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
 * 店舗の登録・編集フォームの状態とロジックを管理する共通フック。
 *
 * `react-hook-form`と連携し、以下の機能を提供します:
 * - `create` / `edit` モードに応じたフォームの初期化
 * - フォーム値のバリデーション
 * - トッピングコールの選択状態管理
 * - フォーム送信用のデータ生成
 *
 * @param {UseStoreFormOptions} options - フックの初期化オプション。詳細は`UseStoreFormOptions`型定義を参照してください。
 * @property {{menuName?: string, menuType?: string, imageUrl?: string, toppingSelections?: Array<{topping_id:number|string,call_option_id:number|string,store_topping_call_id:number|string}>}} [initialData] - 初期データ（編集モード用）
 * @property {(values: ImageFormValues, userId: string) => Promise<{ 
 *     store_id: string,
 *     user_id: string,
 *     menu_type: number,
 *     menu_name: string,
 *     image_base64?: string,
 *     topping_selections?: Array<{
 *         topping_id: number,
 *         call_option_id: number,
 *         store_topping_call_id?: string
 *     }>
 * }>} createSubmitData - 送信データ生成関数
 * @returns {UseStoreFormReturn} フォームの状態と操作関数を含むオブジェクト。詳細は`UseStoreFormReturn`型定義を参照してください。
 */

export function useStoreForm(
    { mode, initialData, toppingOptions }: UseStoreFormOptions
): UseStoreFormReturn {
    // トッピングコール関連の状態
    const [toppingOptionData, setToppingOptionData] = useState<ToppingOptionMap>({})
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