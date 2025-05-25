"use client"

import { createStore } from "@/app/api/stores"
import { getToppingCallOptions } from "@/app/api/toppingCalls"
import { StoreFormInputText } from "@/components/StoreFormInputText"
import { StoreRegisterToppingCallsCheck } from "@/components/StoreRegisterToppingCalls"
import StoreSwitch from "@/components/StoreSwitch"
import { formattedToppingCalls } from "@/lib/toppingCallFormatter"
import { FormattedToppingOptionIds, ResultToppingCall } from "@/types/ToppingCall"
import { StoreFormInput, StoreInputSchema } from "@/validations/store"
import { zodResolver } from "@hookform/resolvers/zod"
import { AccessTime, EventBusy, Map, Store } from "@mui/icons-material"
import { Alert, Box, Button, CircularProgress, Typography } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"


const CreateStorePage = () => {

    // DBから取得したトッピング・コール情報（初期表示時取得）
    const [toppingOptionData, setToppingOptionData] = useState<Record<string, ResultToppingCall>>({})
    // 選択したトッピング・コール情報
    const [selectedCallOptions, setSelectedCallOptions] = useState<FormattedToppingOptionIds>({})
    // submitエラー有無
    const [submitError, setSubmitError] = useState<string | null>(null)
    // 登録完了メッセージ
    const [regSuccessMsg, setRegSuccessMsg] = useState<string | null>(null)


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

    // トッピングコール情報取得APIを呼び出す
    const { data, isLoading: isInitDispLoading, error: initDispError } = useQuery({
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
        setSelectedCallOptions({ ...initSelectedOptions })
    }, [data])

    // console.log(Object.values(toppingOptionData))

    const handleChangeToppingOptionCheck = (toppingId: number, optionId: number, isChecked: boolean) => {
        setSelectedCallOptions(prev => {
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
    }

    const onSubmit = async (formData: StoreFormInput) => {
        try {
            // console.log("フォームデータ：", formData)
            // console.log("選択したトッピングとコール：", selectedCallOptions)
            const toppingCallsData = formattedToppingCalls(selectedCallOptions)
            // console.log("編集後のトッピングコール：", toppingCallsData)

            // 送信データ（formData+toppingCallsData）を作成
            const submitData = {
                ...formData,
                topping_calls: toppingCallsData
            }
            // console.log("送信データ：", submitData)

            const res = await createStore(submitData)
            setRegSuccessMsg(res)
            reset()

        } catch (error) {
            console.error("店舗登録処理でエラー", error)
            setSubmitError("店舗登録処理に失敗しました。")
        }

    }
    // 初期表示時のローディング
    if (isInitDispLoading) return (
        <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="100vh" >
            <CircularProgress color="primary" />
            <p className="mt-4 text-gray-300">Loading...</p>
        </Box>
    )

    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            className="border dark:border-gray-300 shadow-md rounded-md p-8 max-w-lg w-full bg-gray-200 text-slate-800"
            noValidate
        >
            <Typography variant="h5" mb={6} textAlign={"center"} fontWeight="bold">
                店舗情報登録
            </Typography>
            {initDispError && (
                <p className="text-red-500 text-sm">{initDispError.message}</p>
            )}
            <StoreFormInputText name="store_name" control={control} label="店舗名" errors={errors} startAdornment={<Store />} required margin="normal" />
            <StoreFormInputText name="branch_name" control={control} label="支店名" errors={errors} startAdornment={<Store />} margin="normal" />
            <StoreFormInputText name="address" control={control} label="住所" errors={errors} startAdornment={<Map />} required margin="normal" />
            <StoreFormInputText name="business_hours" control={control} label="営業時間" errors={errors} startAdornment={<AccessTime />} required margin="normal" />
            <StoreFormInputText name="regular_holidays" control={control} label="定休日" errors={errors} startAdornment={<EventBusy />} required margin="normal" />
            <StoreSwitch name="prior_meal_voucher" control={control} label="事前食券購入有無" />

            <StoreRegisterToppingCallsCheck
                toppingOptions={toppingOptionData}
                selectedOption={selectedCallOptions}
                onOptionChange={(toppingId, optionId, isChecked) => handleChangeToppingOptionCheck(toppingId, optionId, isChecked)}
                callType="pre_call"
            />
            <StoreFormInputText name="topping_details" control={control} label="トッピング補足情報" errors={errors} margin="normal" multiline rows={3} />
            <StoreFormInputText name="call_details" control={control} label="コール補足情報" errors={errors} margin="normal" multiline rows={3} />
            <StoreSwitch name="is_all_increased" control={control} label="全マシコール有無" />
            <StoreSwitch name="is_lot" control={control} label="ロット制有無" />
            <StoreFormInputText name="lot_detail" control={control} label="ロット詳細情報" errors={errors} margin="normal" multiline rows={3} />
            <Button variant="contained" type="submit" className="mt-4 w-full font-bold">
                店舗登録
            </Button>
            {submitError && (
                <Alert severity="error" className="my-4" variant="filled">{submitError}</Alert>
            )}
            {regSuccessMsg && (
                <Alert severity="success" className="my-4" variant="filled">{regSuccessMsg}</Alert>
            )}
        </form>
    )
}

export default CreateStorePage