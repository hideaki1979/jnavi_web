import { SelectedToppingInfo } from "@/types/Image";
import { SimulationToppingOption } from "@/types/ToppingCall";
import { ExpressValidationError } from "@/types/validation";
import { imageEditFormSchema, ImageEditFormValues, imageUploadFormSchema, ImageUploadFormValues, validateFileSizeBeforeCompression } from "@/validations/image";
import { useCallback, useEffect, useState } from "react";
import { Control, FieldErrors, useForm, UseFormHandleSubmit, UseFormReset, UseFormSetValue } from "react-hook-form";
import { useApiError } from "./useApiError";
import { zodResolver } from "@hookform/resolvers/zod";
import { useStoreToppingCallsForImage } from "./api/useImages";
import imageCompression from "browser-image-compression"

// フォームの共通型定義
type ImageFormValues = ImageUploadFormValues | ImageEditFormValues

interface UseImageFormOptions {
    mode: 'create' | 'edit';
    storeId: string;
    initialData?: {
        menuName?: string;
        menuType?: string;
        imageUrl?: string;
        toppingSelections?: Array<{
            topping_id: number | string;
            call_option_id: number | string;
            store_topping_call_id: number | string;
        }>
    }
    initialToppingOptions?: SimulationToppingOption[]
}

interface UseImageFormReturn {
    // React Hook Form
    control: Control<ImageFormValues>;
    handleSubmit: UseFormHandleSubmit<ImageFormValues>;
    errors: FieldErrors<ImageFormValues>;
    reset: UseFormReset<ImageFormValues>;
    setValue: UseFormSetValue<ImageFormValues>;

    // 画像関連
    imageUrl: string;
    handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
    handleImageRemove: () => void;

    // トッピング関連
    toppingOptions: SimulationToppingOption[];
    selectedToppingInfo: Record<string, SelectedToppingInfo>;
    handleOptionChange: (toppingId: string, optionId: string, storeToppingCallId: string) => void;

    // エラーハンドリング
    errorMessage: string | null
    validationErrors: ExpressValidationError[];
    setError: (error: unknown) => void;
    clearErrors: () => void

    // ローディング状態
    isToppingLoading: boolean;
    isToppingError: boolean;
    toppingErrorMessage: string | null;

    // 送信データ生成
    createSubmitData: (values: ImageFormValues, userId: string) => Promise<{
        store_id: string;
        user_id: string;
        menu_type: number;
        menu_name: string;
        image_base64?: string;
        topping_selections?: Array<{
            topping_id: number;
            call_option_id: number;
            store_topping_call_id?: string;
        }>
    }>
}

/**
 * 画像フォーム用の共通hook
 *
 * @param {UseImageFormOptions} options
 * @returns {UseImageFormReturn}
 */
/**
 * @typedef {Object} UseImageFormOptions
 * @property {'create' | 'edit'} mode - 'create' or 'edit' mode
 * @property {string} storeId - store ID
 * @property {ImageFormValues} initialData - initial data for edit mode
 * @property {SimulationToppingOption[]} initialToppingOptions - initial topping options
 */
/**
 * @typedef {Object} UseImageFormReturn
 * @property {Control<ImageFormValues>} control - React Hook Form control
 * @property {UseFormHandleSubmit<ImageFormValues>} handleSubmit - React Hook Form handleSubmit
 * @property {FieldErrors<ImageFormValues>} errors - React Hook Form errors
 * @property {UseFormReset<ImageFormValues>} reset - React Hook Form reset
 * @property {UseFormSetValue<ImageFormValues>} setValue - React Hook Form setValue
 * @property {string} imageUrl - current image URL
 * @property {(e: React.ChangeEvent<HTMLInputElement>) => Promise<void>} handleImageChange - image change handler
 * @property {() => void} handleImageRemove - image remove handler
 * @property {SimulationToppingOption[]} toppingOptions - topping options
 * @property {Record<string, SelectedToppingInfo>} selectedToppingInfo - selected topping info
 * @property {(toppingId: string, optionId: string, storeToppingCallId: string) => void} handleOptionChange - topping option change handler
 * @property {string | null} errorMessage - API error message
 * @property {ExpressValidationError[]} validationErrors - validation errors
 * @property {(error: unknown) => void} setError - set error
 * @property {() => void} clearErrors - clear errors
 * @property {boolean} isToppingLoading - topping loading state
 * @property {boolean} isToppingError - topping error state
 * @property {string | null} toppingErrorMessage - topping error message
 * @property {(values: ImageFormValues, userId: string) => Promise<{[key: string]: string | number | undefined}>} createSubmitData - create submit data
 */
export function useImageForm({ mode, storeId, initialData, initialToppingOptions }: UseImageFormOptions): UseImageFormReturn {
    // 画像URL状態
    const [imageUrl, setImageUrl] = useState('')
    // トッピング選択状態
    const [selectedToppingInfo, setSelectedToppingInfo]
        = useState<Record<string, SelectedToppingInfo>>({})

    // API エラーハンドリング
    const { errorMessage, validationErrors, setError, clearErrors } = useApiError()

    // トッピングコール情報取得
    const {
        data: toppingCallData,
        isLoading: isToppingLoading,
        isError: isToppingError,
        error: toppingError
    }
        = useStoreToppingCallsForImage(storeId, {
            enabled: !initialToppingOptions
        })

    const toppingOptions: SimulationToppingOption[]
        = initialToppingOptions ?? toppingCallData?.formattedToppingOptions?.map(([, opt]) => opt) ?? []

    const toppingErrorMessage = isToppingError ? (toppingError as Error).message : null

    // フォームスキーマの選択
    const schema = mode === 'create' ? imageUploadFormSchema : imageEditFormSchema

    // フォームのデフォルト値設定
    const defaultValues = mode === 'create'
        ? {
            menuType: "1",
            menuName: "",
            imageFile: undefined
        }
        : {
            menuType: initialData?.menuType || "",
            menuName: initialData?.menuName || "",
            imageFile: undefined
        }

    // react-hook-form+zod定義
    const { control, handleSubmit, setValue, formState: { errors }, reset }
        = useForm<ImageFormValues>({
            resolver: zodResolver(schema),
            defaultValues
        })

    // 編集モードの初期化処理
    useEffect(() => {
        if (mode === 'edit' && initialData) {

            // フォームフィールドの初期値設定
            reset({
                menuName: initialData.menuName || "",
                menuType: initialData.menuType || "",
                imageFile: undefined
            })
            // 画像URLの設定
            if (initialData.imageUrl) {
                setImageUrl(initialData.imageUrl)
            }

            // トッピング選択状態の初期設定
            if (initialData.toppingSelections) {
                const initialToppingInfo: Record<string, SelectedToppingInfo> = {}
                initialData.toppingSelections.forEach((selection) => {
                    initialToppingInfo[String(selection.topping_id)] = {
                        optionId: String(selection.call_option_id),
                        storeToppingCallId: String(selection.store_topping_call_id)
                    }
                })
                setSelectedToppingInfo(initialToppingInfo)
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode, initialData])

    // 画像選択・リサイズ
    const handleImageChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        try {
            // ファイル圧縮前のサイズチェック（圧縮前のサイズが２０MBを超えた場合エラー）
            validateFileSizeBeforeCompression(file)

            // ファイル画像圧縮処理
            const compressed = await imageCompression(file, {
                maxWidthOrHeight: 1080,
                maxSizeMB: 5,   // 圧縮後のファイルサイズ
                useWebWorker: true
            })
            // Blob→File型に変換
            const compressedFile = compressed instanceof File
                ? compressed
                : new File([compressed], file.name, {
                    type: file.type,
                    lastModified: Date.now()
                })
            // 古いURLを解放
            if (imageUrl && imageUrl.startsWith('blob:')) {
                URL.revokeObjectURL(imageUrl)
            }
            setImageUrl(URL.createObjectURL(compressedFile))
            setValue("imageFile", compressedFile, { shouldValidate: true })
        } catch (err) {
            setError(err instanceof Error ? err : new Error('画像の最適化に失敗しました'))
        }
    }, [setValue, setError, imageUrl])

    // 画像削除
    const handleImageRemove = useCallback(() => {
        // 古いURLを解放
        if (imageUrl && imageUrl.startsWith('blob:')) {
            URL.revokeObjectURL(imageUrl)
        }
        setImageUrl("")
        setValue("imageFile", undefined, { shouldValidate: true })
    }, [setValue, imageUrl])

    // クリーンアップ処理
    useEffect(() => {
        return () => {
            // コンポーネントアンマウント時にblob URLを解放
            if (imageUrl && imageUrl.startsWith('blob:')) {
                URL.revokeObjectURL(imageUrl)
            }
        }
    }, [imageUrl])

    // トッピング選択
    const handleOptionChange = useCallback((toppingId: string, optionId: string, storeToppingCallId: string) => {
        setSelectedToppingInfo(prev => ({
            ...prev,
            [toppingId]: { optionId, storeToppingCallId }
        }))
    }, [])

    // 画像ファイルアップロード
    const createSubmitData = useCallback(async (values: ImageFormValues, userId: string) => {
        // 画像ファイルのBase64変換
        let base64: string | undefined

        if (values.imageFile) {
            base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader()
                reader.onload = () => resolve(reader.result as string)
                reader.onerror = reject
                reader.readAsDataURL(values.imageFile!)
            })
        }

        const toppingSelections = Object.entries(selectedToppingInfo).map(([toppingId, info]) => ({
            topping_id: Number(toppingId),
            call_option_id: Number(info.optionId),
            ...(info.storeToppingCallId ? { store_topping_call_id: String(info.storeToppingCallId) } : {})
        }))

        return {
            store_id: storeId,
            user_id: userId,
            menu_type: Number(values.menuType),
            menu_name: values.menuName,
            // 既存の画像に変更がない場合は image_base64 フィールドを省略する
            ...(base64 ? { image_base64: base64 } : {}),
            ...(toppingSelections.length > 0 ? { topping_selections: toppingSelections } : {})
        }
    }, [selectedToppingInfo, storeId])

    return {
        // React Hook Form
        control,
        handleSubmit,
        errors,
        reset,
        setValue,

        // 画像関連
        imageUrl,
        handleImageChange,
        handleImageRemove,

        // トッピング関連
        toppingOptions,
        selectedToppingInfo,
        handleOptionChange,

        // エラーハンドリング
        errorMessage,
        validationErrors,
        setError,
        clearErrors,

        // ローディング状態
        isToppingLoading,
        isToppingError,
        toppingErrorMessage,

        // 送信データ生成
        createSubmitData
    }
}
