"use client"

import { ValidationErrorList } from "@/components/feedback/validationErrorList"
import { StoreFormInputText } from "@/components/Store/StoreFormInputText"
import { StoreRegisterToppingCallsCheck } from "@/components/toppingCallOptions/StoreRegisterToppingCalls"
import { StoreSubmitButton } from "@/components/Store/StoreSubmitButton"
import StoreSwitch from "@/components/Store/StoreSwitch"
import { useCreateStore, useUpdateStore } from "@/hooks/api/useStores"
import { useStoreForm } from "@/hooks/useStoreForm"
import { StoreFormInput } from "@/validations/store"
import { AccessTime, EventBusy, ExpandMore, Map as MapIcon, Store } from "@mui/icons-material"
import { Accordion, AccordionDetails, AccordionSummary, Typography } from "@mui/material"
import { useMemo } from "react"
import { FormattedToppingOptionNameStoreData } from "@/types/Store"
import { ToppingOptionMap } from "@/types/ToppingCall"

interface StoreFormProps {
    mode: 'create' | 'edit';
    initialData?: FormattedToppingOptionNameStoreData;
    toppingOptions: ToppingOptionMap;
}

/**
 * 店舗登録・編集画面フォーム
 *
 * - modeに応じて登録または編集処理を実行
 * - useStoreFormフックからフォーム状態とロジックを取得
 * - フォームの送信、バリデーション、UIの表示を管理
 *
* @returns {JSX.Element}
 */
export default function StoreForm({ mode, initialData, toppingOptions }: StoreFormProps) {

    // データ更新: カスタムフックを使用
    const { mutateAsync: createStore, isPending: isCreating } = useCreateStore()
    const { mutateAsync: updateStore, isPending: isUpdating } = useUpdateStore()

    // useMemoを使用してinitialDataの不要な再生成を防止
    const initialDataForForm = useMemo(() => {
        if (mode === 'create' || !initialData) return undefined
        return {
            ...initialData,
            branch_name: initialData.branch_name ?? undefined,
            topping_details: initialData.topping_details ?? undefined,
            call_details: initialData.call_details ?? undefined,
            lot_detail: initialData.lot_detail ?? undefined,
            preCallFormattedIds: initialData.preCallFormattedIds,
            postCallFormattedIds: initialData.postCallFormattedIds
        }
    }, [initialData, mode])

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

        // 送信データ生成
        createSubmitData
    } = useStoreForm({
        mode,
        initialData: initialDataForForm,
        toppingOptions
    })

    /**
     * 店舗情報を登録または更新するためにフォームデータを送信する非同期関数。
     * - modeに応じて、作成APIまたは更新APIを呼び出す。
     * - 成功時には適切なページにリダイレクトする。
     * - エラー発生時にはエラーメッセージを表示し、コンソールにエラーを出力。
     * @param formData フォーム入力データ
     */

    const onSubmit = async (formData: StoreFormInput): Promise<void> => {
        try {
            const submitData = createSubmitData(formData)
            if (mode === 'create') {
                await createStore(submitData)
            } else {
                if (!initialData) {
                    console.error('編集モードでは店舗データが必要ですが、取得されていません。')
                    setError('編集モードでは店舗データが必要ですが、取得されていません。')
                    return
                }
                await updateStore({ id: String(initialData.id), storeData: submitData })
            }
        } catch (error) {
            console.error(`店舗${mode === 'create' ? '登録' : '更新'}処理でエラー発生しました`, error)
            setError(error)
        }
    }

    const isLoading = isCreating || isUpdating

    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            className="border dark:border-gray-300 shadow-md rounded-md p-8 bg-gray-200 text-slate-800"
            noValidate
        >
            <Typography variant="h5" fontWeight="bold" textAlign="center" mb={6}>
                {mode === 'create' ? '店舗登録画面' : '店舗編集画面'}
            </Typography>
            <StoreFormInputText name="store_name" control={control} label="店舗名" errors={errors} startAdornment={<Store />} required margin="normal" />
            <StoreFormInputText name="branch_name" control={control} label="支店名" errors={errors} startAdornment={<Store />} margin="normal" />
            <StoreFormInputText name="address" control={control} label="住所" errors={errors} startAdornment={<MapIcon />} required margin="normal" />
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
            <StoreFormInputText name="lot_detail" control={control} label="ロット補足情報" errors={errors} margin="normal" multiline rows={3} />

            {/* バリデーションエラー表示 */}
            <ValidationErrorList errors={validationErrors} />
            <StoreSubmitButton
                label={mode === 'create' ? "店舗登録" : "店舗更新"}
                loading={isLoading} />
        </form>
    )
}
