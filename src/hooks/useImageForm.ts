import { SelectedToppingInfoMap, SimulationToppingOption } from "@/types/ToppingCall";
import { ExpressValidationError } from "@/types/validation";
import { imageEditFormSchema, ImageEditFormValues, IMAGE_OUTPUT_MIME_TYPE, imageUploadFormSchema, ImageUploadFormValues, validateFileSizeBeforeCompression } from "@/validations/image";
import { useCallback, useEffect, useMemo, useState } from "react";
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
    selectedToppingInfo: SelectedToppingInfoMap;
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
 * 画像のアップロード・編集フォームの状態とロジックを管理する共通フック。
 *
 * `react-hook-form`と連携し、以下の機能を提供します:
 * - フォームの状態管理 (値、エラー)
 * - 画像の選択、圧縮、プレビュー、削除
 * - トッピング情報の取得と選択状態の管理
 * - `create`モードと`edit`モードのサポート
 * - 送信データの生成
 */
export function useImageForm({ mode, storeId, initialData, initialToppingOptions }: UseImageFormOptions): UseImageFormReturn {
    // 編集モードの初期値をレンダリング中に導出する
    const editInitialData = mode === 'edit' ? initialData : undefined

    const initialImageUrl = editInitialData?.imageUrl || ''

    const initialToppingInfo = useMemo<SelectedToppingInfoMap>(() => {
        const toppingInfo: SelectedToppingInfoMap = {}
        editInitialData?.toppingSelections?.forEach((selection) => {
            toppingInfo[String(selection.topping_id)] = {
                optionId: String(selection.call_option_id),
                storeToppingCallId: String(selection.store_topping_call_id)
            }
        })
        return toppingInfo
    }, [editInitialData])

    // 画像URL状態
    const [imageUrl, setImageUrl] = useState(initialImageUrl)
    // トッピング選択状態
    const [selectedToppingInfo, setSelectedToppingInfo]
        = useState<SelectedToppingInfoMap>(initialToppingInfo)

    // initialDataが差し替わったら初期値へ戻す。
    // React公式の「props変更時にレンダリング中でstateを調整する」パターン
    // （https://react.dev/reference/react/useState#storing-information-from-previous-renders）
    const [appliedInitialData, setAppliedInitialData] = useState(editInitialData)
    if (appliedInitialData !== editInitialData) {
        setAppliedInitialData(editInitialData)
        setSelectedToppingInfo(initialToppingInfo)
        if (initialImageUrl) setImageUrl(initialImageUrl)
    }

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
    const defaultValues = useMemo(() => mode === 'create'
        ? {
            menuType: "1",
            menuName: "",
            imageFile: undefined
        }
        : {
            menuType: initialData?.menuType || "",
            menuName: initialData?.menuName || "",
            imageFile: undefined
        }, [mode, initialData])

    // react-hook-form+zod定義
    // initialData差し替え時のフォーム再初期化は react-hook-form の values に任せる
    // （useEffect + reset だと同期setStateを伴い react-hooks/set-state-in-effect に抵触するため）
    const { control, handleSubmit, setValue, formState: { errors }, reset }
        = useForm<ImageFormValues>({
            resolver: zodResolver(schema),
            defaultValues,
            values: editInitialData ? defaultValues : undefined
        })

    // 画像選択・リサイズ
    const handleImageChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        try {
            // ファイル圧縮前のサイズチェック（圧縮前のサイズが２０MBを超えた場合エラー）
            validateFileSizeBeforeCompression(file)

            // ファイル画像圧縮処理
            // fileTypeを指定してJPEGへ変換する。iPhoneのHEIC/HEIFや、
            // 環境によって付与される image/jpg をサーバが受け付ける形式に正規化するため
            const compressed = await imageCompression(file, {
                maxWidthOrHeight: 1080,
                maxSizeMB: 5,   // 圧縮後のファイルサイズ
                useWebWorker: true,
                fileType: IMAGE_OUTPUT_MIME_TYPE
            })
            // Blob→File型に変換（拡張子・MIMEタイプも変換後の形式に揃える）
            const convertedFileName = file.name.replace(/\.[^.]+$/, '') + '.jpg'
            const compressedFile = compressed instanceof File && compressed.type === IMAGE_OUTPUT_MIME_TYPE
                ? compressed
                : new File([compressed], convertedFileName, {
                    type: IMAGE_OUTPUT_MIME_TYPE,
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
