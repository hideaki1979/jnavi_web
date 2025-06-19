"use client"

import LoadingErrorContainer from "@/components/feedback/LoadingErrorContainer"
import { ValidationErrorList } from "@/components/feedback/validationErrorList"
import { StoreFormInputText } from "@/components/StoreFormInputText"
import { StoreRegisterToppingCallsCheck } from "@/components/StoreRegisterToppingCalls"
import { StoreSubmitButton } from "@/components/StoreSubmitButton"
import StoreSwitch from "@/components/StoreSwitch"
import { useStore, useUpdateStore } from "@/hooks/api/useStores"
import { useStoreForm } from "@/hooks/useStoreForm"
import { StoreFormInput } from "@/validations/store"
import { AccessTime, EventBusy, ExpandMore, Map, Store } from "@mui/icons-material"
import { Accordion, AccordionDetails, AccordionSummary, Typography } from "@mui/material"
import { useParams, useRouter } from "next/navigation"
import { useMemo } from "react"

/**
 * 店舗編集画面
 *
 * - 店舗情報を取得
 * - トッピングコール情報を取得
 * - 店舗情報を編集して、トッピングコール情報を更新
 *
* @returns {JSX.Element}
 */
export default function StoreUpdatePage() {

    const router = useRouter()
    const params = useParams()
    const storeId = params.id as string

    // データ取得: カスタムフックuseStoreを使用
    const { data: storeData, isLoading: isStoreLoading, isError: isStoreError, error: storeError } = useStore(storeId)

    // データ更新: カスタムフック useUpdateStore を使用 
    const { mutateAsync: updateStore, isPending: isUpdating } = useUpdateStore()

    // useMemoを使用してinitialDataの不要な再生成を防止
    const initialDataForForm = useMemo(() => {
        if (!storeData) return undefined
        return {
            ...storeData,
            branch_name: storeData.branch_name ?? undefined,
            topping_details: storeData.topping_details ?? undefined,
            call_details: storeData.call_details ?? undefined,
            lot_detail: storeData.lot_detail ?? undefined,
            preCallFormattedIds: storeData.preCallFormattedIds,
            postCallFormattedIds: storeData.postCallFormattedIds
        }
    }, [storeData])

    // 共通化されたフォーム状態管理フック（編集モード）
    const {
        // react-hook-form
        control,
        handleSubmit,
        errors,

        // トッピングコール状態
        toppingOptionData,
        selectedPreCallOptions,
        selectedPostCallOptions,
        handleChangePreCallOptionCheck,
        handleChangePostCallOptionCheck,

        // エラーハンドリング
        validationErrors,
        setError,

        // ローディング状態
        isInitialLoading,
        isInitialError,
        initErrorMessage,

        // 送信データ生成
        createSubmitData
    } = useStoreForm({
        mode: "edit",
        initialData: initialDataForForm
    })

    /**
     * 店舗情報を更新する際にフォームデータを送信する非同期関数。
     * - 事前コールと着丼前コールの選択オプションを整形し、送信データに含める。
     * - 店舗情報更新APIに送信データを送信し、成功時には成功メッセージを表示。
     * - エラー発生時にはエラーメッセージを表示し、コンソールにエラーを出力。
     * @param formData フォーム入力データ
     */

    const onSubmit = async (formData: StoreFormInput) => {
        try {
            const submitData = createSubmitData(formData)

            await updateStore({ id: storeId, storeData: submitData })
            setTimeout(() => router.replace(`/stores/map`), 1500)
        } catch (error) {
            console.error("店舗更新処理でエラー発生しました", error)
            setError(error)
        }
    }

    const loading = isStoreLoading || isInitialLoading
    const hasError = isStoreError || isInitialError
    const errMessage = isStoreError ? (storeError as Error).message : isInitialError ? initErrorMessage : null
    // 初期表示時のローディング
    if (loading || hasError) {
        return <LoadingErrorContainer loading={isStoreLoading} error={errMessage} />
    }

    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            className="border dark:border-gray-300 shadow-md rounded-md p-8 bg-gray-200 text-slate-800"
            noValidate
        >
            <Typography variant="h5" fontWeight="bold" textAlign="center" mb={6}>
                店舗編集画面
            </Typography>
            <StoreFormInputText name="store_name" control={control} label="店舗名" errors={errors} startAdornment={<Store />} required margin="normal" />
            <StoreFormInputText name="branch_name" control={control} label="支店名" errors={errors} startAdornment={<Store />} margin="normal" />
            <StoreFormInputText name="address" control={control} label="住所" errors={errors} startAdornment={<Map />} required margin="normal" />
            <StoreFormInputText name="business_hours" control={control} label="営業時間" errors={errors} startAdornment={<AccessTime />} required margin="normal" />
            <StoreFormInputText name="regular_holidays" control={control} label="定休日" errors={errors} startAdornment={<EventBusy />} required margin="normal" />
            <StoreSwitch name="prior_meal_voucher" control={control} label="事前食券購入有無" />

            {/* 事前トッピングコール情報 */}
            <Accordion defaultExpanded sx={{ mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="subtitle1" fontWeight="bold">
                        事前トッピングコール
                    </Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <StoreRegisterToppingCallsCheck
                        toppingOptions={toppingOptionData}
                        selectedOption={selectedPreCallOptions}
                        onOptionChange={handleChangePreCallOptionCheck}
                        callType="pre_call"
                    />
                </AccordionDetails>
            </Accordion>
            {/* 事前トッピングコール情報 */}
            <Accordion defaultExpanded sx={{ mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="subtitle1" fontWeight="bold">
                        着丼前トッピングコール
                    </Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <StoreRegisterToppingCallsCheck
                        toppingOptions={toppingOptionData}
                        selectedOption={selectedPostCallOptions}
                        onOptionChange={handleChangePostCallOptionCheck}
                        callType="post_call"
                    />
                </AccordionDetails>
            </Accordion>
            {/* バリデーションエラー表示 */}
            <ValidationErrorList errors={validationErrors} />
            <StoreSubmitButton label="店舗更新" loading={isUpdating} />
        </form>
    )
}
