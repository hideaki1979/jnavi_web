"use client"

import { getStoreById, updateStore } from "@/app/api/stores"
import { getToppingCallOptions } from "@/app/api/toppingCalls"
import LoadingErrorContainer from "@/components/feedback/LoadingErrorContainer"
import { StoreFormInputText } from "@/components/StoreFormInputText"
import { StoreRegisterToppingCallsCheck } from "@/components/StoreRegisterToppingCalls"
import { StoreSubmitButton } from "@/components/StoreSubmitButton"
import StoreSwitch from "@/components/StoreSwitch"
import { formattedToppingCalls } from "@/lib/toppingCallFormatter"
import { FormattedToppingOptionIds, ResultToppingCall } from "@/types/ToppingCall"
import { createToppingOptionHandler } from "@/utils/toppingOptionUtils"
import { StoreFormInput, StoreInputSchema } from "@/validations/store"
import { zodResolver } from "@hookform/resolvers/zod"
import { AccessTime, EventBusy, ExpandMore, Map, Store } from "@mui/icons-material"
import { Accordion, AccordionDetails, AccordionSummary, Alert, Typography } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"

/**
 * 店舗編集画面
 *
 * - 店舗情報を取得
 * - トッピングコール情報を取得
 * - 店舗情報を編集して、トッピングコール情報を更新
 *
 * @returns
 */
export default function StoreUpdatePages() {

    const router = useRouter()
    const params = useParams()
    const storeId = params.id as string

    // トッピングとコールオプションのデータ管理
    const [toppingOptionData, setToppingOptionData] = useState<Record<number, ResultToppingCall>>({})

    // 選択したコールオプションを状態管理（事前用・着丼前用
    const [selectedPreCallOptions, setSelectedPreCallOptions] = useState<FormattedToppingOptionIds>({})
    const [selectedPostCallOptions, setSelectedPostCallOptions] = useState<FormattedToppingOptionIds>({})

    // ハンドラー関数を生成
    const handleChangePreCallOptionCheck = createToppingOptionHandler(setSelectedPreCallOptions)
    const handleChangePostCallOptionCheck = createToppingOptionHandler(setSelectedPostCallOptions)

    // Submit関連
    const [submitError, setSubmitError] = useState<string | null>(null)
    const [isSubmitLoading, setIsSubmitLoading] = useState<boolean>(false)
    const [updateSuccessMsg, setUpdateSuccessMsg] = useState<string | null>(null)

    // フォームの状態管理
    const { control, handleSubmit, formState: { errors }, reset } = useForm<StoreFormInput>({
        resolver: zodResolver(StoreInputSchema),
        defaultValues: {
            store_name: "",
            branch_name: "",
            address: "",
            business_hours: "",
            regular_holidays: "",
            prior_meal_voucher: false,
            is_all_increased: false,
            is_lot: false,
            topping_details: "",
            call_details: "",
            lot_detail: ""
        }
    })

    // 店舗データを取得
    const { data: storeData, isLoading: getStoreLoading, isError: isGetStoreError, error: storeError } = useQuery({
        queryKey: ['getStoreInfo', storeId],
        queryFn: () => getStoreById(storeId)
    })

    // トッピングコール情報を取得
    const { data: toppingCallData, isLoading: getToppingCallLoading, isError: isGetToppingCallLoading, error: toppingCallError } = useQuery({
        queryKey: ['getToppingCall'],
        queryFn: getToppingCallOptions
    })

    // 店舗データ取得完了後にフォームの初期値を設定する
    useEffect(() => {
        if (storeData) {
            reset({
                store_name: storeData.store_name || "",
                branch_name: storeData.branch_name || "",
                address: storeData.address || "",
                business_hours: storeData.business_hours || "",
                regular_holidays: storeData.regular_holidays || "",
                prior_meal_voucher: storeData.prior_meal_voucher || false,
                is_all_increased: storeData.is_all_increased || false,
                is_lot: storeData.is_lot || false,
                topping_details: storeData.topping_details || "",
                call_details: storeData.call_details || "",
                lot_detail: storeData.lot_detail || ""
            })
            const preToppingCalls = storeData.preCallFormattedIds || {}
            const postToppingCalls = storeData.postCallFormattedIds || {}
            setSelectedPreCallOptions(preToppingCalls)
            setSelectedPostCallOptions(postToppingCalls)
            // console.log("事前トッピング情報：", preToppingCalls)
            // console.log("着丼前トッピング情報：", postToppingCalls)
        }
    }, [storeData, reset])

    // トッピングコール情報取得完了後にトッピングコール情報を設定する。
    useEffect(() => {
        if (toppingCallData) {
            setToppingOptionData(toppingCallData)
        }
    }, [toppingCallData])

    /**
     * 店舗情報を更新する際にフォームデータを送信する非同期関数。
     * - 事前コールと着丼前コールの選択オプションを整形し、送信データに含める。
     * - 店舗情報更新APIに送信データを送信し、成功時には成功メッセージを表示。
     * - エラー発生時にはエラーメッセージを表示し、コンソールにエラーを出力。
     * @param formData フォーム入力データ
     */

    const onSubmit = async (formData: StoreFormInput) => {
        try {
            setIsSubmitLoading(true)
            const preCallData = formattedToppingCalls(selectedPreCallOptions, "pre_call")
            const postCallData = formattedToppingCalls(selectedPostCallOptions, "post_call")
            const toppingCallData = [...preCallData, ...postCallData]
            const submitData = {
                ...formData,
                topping_calls: toppingCallData
            }

            const res = await updateStore(storeId, submitData)
            setUpdateSuccessMsg(res)
            setIsSubmitLoading(false)
            setTimeout(() => router.replace(`/stores/map`), 1500)
        } catch (error) {
            console.error("店舗登録処理でエラー", error)
            setSubmitError("店舗登録処理に失敗しました。")
            setIsSubmitLoading(false)
        }
    }

    const loading = getStoreLoading || getToppingCallLoading
    const hasError = isGetStoreError || isGetToppingCallLoading
    const errMessage = isGetStoreError ? (storeError as Error).message : isGetToppingCallLoading ? (toppingCallError as Error).message : null
    // 初期表示時のローディング
    if (loading || hasError) {
        return <LoadingErrorContainer loading={getStoreLoading} error={errMessage} />
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
            {submitError && (
                <Alert severity="error" className="my-4" variant="filled">
                    {submitError}
                </Alert>
            )}
            {updateSuccessMsg && (
                <Alert severity="success" className="my-4" variant="filled">
                    {updateSuccessMsg}
                </Alert>
            )}
            <StoreSubmitButton label="店舗更新" loading={isSubmitLoading} />
        </form>
    )
}
