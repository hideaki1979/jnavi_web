"use client"

import LoadingErrorContainer from "@/components/feedback/LoadingErrorContainer"
import { ValidationErrorList } from "@/components/feedback/validationErrorList"
import { StoreFormInputText } from "@/components/StoreFormInputText"
import { StoreRegisterToppingCallsCheck } from "@/components/StoreRegisterToppingCalls"
import StoreSwitch from "@/components/StoreSwitch"
import { useCreateStore } from "@/hooks/api/useStores"
import { useStoreForm } from "@/hooks/useStoreForm"
import { StoreFormInput } from "@/validations/store"
import { AccessTime, EventBusy, ExpandMore, Map, Store } from "@mui/icons-material"
import { Accordion, AccordionDetails, AccordionSummary, Button, CircularProgress, Typography } from "@mui/material"
import { useRouter } from "next/navigation"


/**
 * 店舗登録画面コンポーネント
 *
 * - トッピングコール情報を取得し、店舗情報を登録するフォームを提供
 * - 事前トッピングコールと着丼前トッピングコールの選択を管理
 * - フォーム送信で店舗情報を登録し、成功メッセージまたはエラーメッセージを表示
 *
 * @returns JSX.Element
 */

const CreateStorePage = () => {

    const router = useRouter()

    // データ更新: カスタムフック useCreateStoreを使用
    const { mutateAsync: createStore, isPending: isCreating } = useCreateStore()

    // 共通化されたフォーム状態管理フック
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
    } = useStoreForm({ mode: 'create' })

    /**
     * 店舗登録処理を行う関数。
     * - トッピングコール情報をマージして、formData+toppingCallsDataを生成
     * - 生成したデータを送信し、店舗登録を実行
     * - 成功時には、画面に成功メッセージを表示
     * - エラー時には、画面にエラーメッセージを表示
     * @param formData 店舗情報
     */
    const onSubmit = async (formData: StoreFormInput) => {
        try {
            const submitData = createSubmitData(formData)
            await createStore(submitData)
            setTimeout(() => router.replace('/stores/map'), 2500)
        } catch (error) {
            console.error("店舗登録処理でエラー", error)
            setError(error)
        }
    }
    // 初期表示時のローディング
    if (isInitialLoading || isInitialError) {
        return <LoadingErrorContainer loading={isInitialLoading} error={isInitialError ? initErrorMessage : null} />
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
            {/* バリデーションエラー表示 */}
            <ValidationErrorList errors={validationErrors} />
            <Button
                variant="contained"
                type="submit"
                className="mt-4 w-full font-bold"
                disabled={isCreating}
            >
                {isCreating ? <CircularProgress size={24} color="inherit" /> : "店舗登録"}
            </Button>
        </form>
    )
}

export default CreateStorePage