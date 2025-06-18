"use client"

import { BaseToppingCall, FormattedToppingOptionIds, ResultToppingCall } from "@/types/ToppingCall";
import { StoreFormInput, StoreInputSchema } from "@/validations/store";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Control, FieldErrors, useForm, UseFormHandleSubmit, UseFormReset } from "react-hook-form";
import { useApiError } from "./useApiError";
import { zodResolver } from "@hookform/resolvers/zod";
import { createToppingOptionHandler } from "@/utils/toppingOptionUtils";
import { useQuery } from "@tanstack/react-query";
import { getToppingCallOptions } from "@/app/api/toppingCalls";
import { formattedToppingCalls } from "@/lib/toppingCallFormatter";
import { ExpressValidationError } from "@/types/validation";

interface UseStoreFormOptions {
    mode: 'create' | 'edit';
    initialData?: Partial<StoreFormInput> & {
        preCallFormattedIds?: FormattedToppingOptionIds;
        postCallFormattedIds?: FormattedToppingOptionIds;
    }
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

    // 送信状態
    isSubmitLoading: boolean;
    setIsSubmitLoading: (loading: boolean) => void;
    successMessage: string | null;
    setSuccessMessage: (message: string | null) => void;

    // エラーハンドリング
    errorMessage: string | null;
    validationErrors: ExpressValidationError[]
    setError: (error: unknown) => void;
    clearErrors: () => void;

    // ローディング状態
    isInitialLoading: boolean;
    isInitialError: boolean;
    initErrorMessage: string | null;

    // 送信データ生成
    createSubmitData: (formData: StoreFormInput) => StoreFormInput & { topping_calls: BaseToppingCall[] }
}

export function useStoreForm({ mode, initialData }: UseStoreFormOptions): UseStoreFormReturn {
    // トッピングコール関連の状態
    const [toppingOptionData, setToppingOptionData] = useState<Record<number, ResultToppingCall>>({})
    const [selectedPreCallOptions, setSelectedPreCallOptions] = useState<FormattedToppingOptionIds>({})
    const [selectedPostCallOptions, setSelectedPostCallOptions] = useState<FormattedToppingOptionIds>({})

    // 通信関連の状態
    const [isSubmitLoading, setIsSubmitLoading] = useState(false)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)

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

    // ハンドラー関数を生成
    const handleChangePreCallOptionCheck = createToppingOptionHandler(setSelectedPreCallOptions)
    const handleChangePostCallOptionCheck = createToppingOptionHandler(setSelectedPostCallOptions)

    // トッピングコール情報取得
    const {
        data: toppingCallData,
        isLoading: isInitialLoading,
        isError: isInitialError,
        error: initError
    } = useQuery({
        queryKey: ['toppingCallOptions'],
        queryFn: getToppingCallOptions
    })

    const initErrorMessage = isInitialError ? (initError as Error).message : null

    // トッピングコール情報の初期化
    useEffect(() => {
        if (!toppingCallData) return

        setToppingOptionData(toppingCallData)

        // 初期選択状態の設定
        const initSelectedOptions: FormattedToppingOptionIds = {}
        Object.keys(toppingCallData).forEach(key => {
            initSelectedOptions[Number(key)] = []
        })

        // 編集モードで初期データがある場合は設定、なければ空で初期化
        setSelectedPreCallOptions({ ...initSelectedOptions })
        setSelectedPostCallOptions({ ...initSelectedOptions })
    }, [toppingCallData])

    // 編集モード時の初期データ設定
    useEffect(() => {
        if (mode === 'edit' && initialData) {
            // トッピングコール選択状態の設定
            if (initialData.preCallFormattedIds) {
                setSelectedPreCallOptions(initialData.preCallFormattedIds)
            }
            if (initialData.postCallFormattedIds) {
                setSelectedPostCallOptions(initialData.postCallFormattedIds)
            }
        }
    }, [mode, initialData])

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

        // 送信状態
        isSubmitLoading,
        setIsSubmitLoading,
        successMessage,
        setSuccessMessage,

        // エラーハンドリング
        errorMessage,
        validationErrors,
        setError,
        clearErrors,

        // ローディング状態
        isInitialLoading,
        isInitialError,
        initErrorMessage,

        // 送信データ生成
        createSubmitData
    }
}