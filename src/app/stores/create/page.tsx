"use client"

import { createStore } from "@/app/api/stores"
import { getToppingCallOptions } from "@/app/api/toppingCalls"
import LoadingErrorContainer from "@/components/feedback/LoadingErrorContainer"
import { StoreFormInputText } from "@/components/StoreFormInputText"
import { StoreRegisterToppingCallsCheck } from "@/components/StoreRegisterToppingCalls"
import StoreSwitch from "@/components/StoreSwitch"
import { formattedToppingCalls } from "@/lib/toppingCallFormatter"
import { FormattedToppingOptionIds, ResultToppingCall } from "@/types/ToppingCall"
import { createToppingOptionHandler } from "@/utils/toppingOptionUtils"
import { StoreFormInput, StoreInputSchema } from "@/validations/store"
import { zodResolver } from "@hookform/resolvers/zod"
import { AccessTime, EventBusy, ExpandMore, Map, Store } from "@mui/icons-material"
import { Accordion, AccordionDetails, AccordionSummary, Alert, Button, CircularProgress, Typography } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"


const CreateStorePage = () => {

    const router = useRouter()

    // DBから取得したトッピング・コール情報（初期表示時取得）
    const [toppingOptionData, setToppingOptionData] = useState<Record<string, ResultToppingCall>>({})
    // 選択したトッピング・コール情報（事前）
    const [selectedPreCallOptions, setSelectedPreCallOptions] = useState<FormattedToppingOptionIds>({})
    // 選択したトッピング・コール情報（着丼前）
    const [selectedPostCallOptions, setSelectedPostCallOptions] = useState<FormattedToppingOptionIds>({})
    // submitエラー有無
    const [submitError, setSubmitError] = useState<string | null>(null)
    // 登録完了メッセージ
    const [regSuccessMsg, setRegSuccessMsg] = useState<string | null>(null)
    // 登録処理時のローディング
    const [isSubmitLoading, setIsSubmitLoading] = useState(false)
    // ハンドラー関数を生成
    const handleChangePreCallOptionCheck = createToppingOptionHandler(setSelectedPreCallOptions)
    const handleChangePostCallOptionCheck = createToppingOptionHandler(setSelectedPostCallOptions)


    const { control, handleSubmit, formState: { errors } } = useForm<StoreFormInput>({
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

    // トッピングコール情報取得APIを呼び出す
    const { data, isLoading: isInitDispLoading, isError, error: initDispError } = useQuery({
        queryKey: ['toppingCallOptions'],
        queryFn: getToppingCallOptions
    })

    // console.log(data)

    useEffect(() => {
        if (!data) return // dataがnullまたはundefinedの場合は処理を行わない。
        // DB管理しているトッピング・コール情報をセット
        setToppingOptionData(data)
        // 選択状態の初期化
        const initSelectedOptions: FormattedToppingOptionIds = {}
        Object.keys(data).forEach(key => {
            initSelectedOptions[Number(key)] = []
        })
        // console.log(initSelectedOptions)
        setSelectedPreCallOptions({ ...initSelectedOptions })
        setSelectedPostCallOptions({ ...initSelectedOptions })
    }, [data])

    const onSubmit = async (formData: StoreFormInput) => {
        try {
            setIsSubmitLoading(true)
            // 事前コールと着丼前コールのデータをマージ
            const preCallsData = formattedToppingCalls(selectedPreCallOptions, "pre_call")
            const postCallsData = formattedToppingCalls(selectedPostCallOptions, "post_call")
            const toppingCallsData = [...preCallsData, ...postCallsData]

            // 送信データ（formData+toppingCallsData）を作成
            const submitData = {
                ...formData,
                topping_calls: toppingCallsData
            }

            const res = await createStore(submitData)
            setRegSuccessMsg(res)
            setIsSubmitLoading(false)
            setTimeout(() => router.replace('/stores/map'), 2500)
        } catch (error) {
            console.error("店舗登録処理でエラー", error)
            setSubmitError("店舗登録処理に失敗しました。")
            setIsSubmitLoading(false)
        }
    }
    // 初期表示時のローディング
    if (isInitDispLoading || isError) {
        return <LoadingErrorContainer loading={isInitDispLoading} error={isError ? (initDispError as Error).message : null} />
    }

    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            className="border dark:border-gray-300 shadow-md rounded-md p-8 bg-gray-200 text-slate-800"
            noValidate
        >
            <Typography variant="h5" mb={6} textAlign={"center"} fontWeight="bold">
                店舗情報登録
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

            {/* 着丼前トッピングコール情報 */}
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
            <StoreFormInputText name="topping_details" control={control} label="トッピング補足情報" errors={errors} margin="normal" multiline rows={3} />
            <StoreFormInputText name="call_details" control={control} label="コール補足情報" errors={errors} margin="normal" multiline rows={3} />
            <StoreSwitch name="is_all_increased" control={control} label="全マシコール有無" />
            <StoreSwitch name="is_lot" control={control} label="ロット制有無" />
            <StoreFormInputText name="lot_detail" control={control} label="ロット詳細情報" errors={errors} margin="normal" multiline rows={3} />
            {submitError && (
                <Alert severity="error" className="my-4" variant="filled">{submitError}</Alert>
            )}
            {regSuccessMsg && (
                <Alert severity="success" className="my-4" variant="filled">{regSuccessMsg}</Alert>
            )}
            <Button
                variant="contained"
                type="submit"
                className="mt-4 w-full font-bold"
                disabled={isSubmitLoading}
            >
                {isSubmitLoading ? <CircularProgress size={24} color="inherit" /> : "店舗登録"}
            </Button>
        </form>
    )
}

export default CreateStorePage