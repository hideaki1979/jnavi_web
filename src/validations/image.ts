import { z } from "zod";

// 圧縮前のファイルサイズ制限（20MB）
const MAX_FILE_SIZE_BEFORE_COMPRESSION = 20 * 1024 * 1024;

/**
 * 圧縮前のファイルサイズをチェック
 */
export const validateFileSizeBeforeCompression = (file: File) => {
    if (file.size > MAX_FILE_SIZE_BEFORE_COMPRESSION) {
        throw new Error(`ファイルサイズが許容サイズを超えてます。${MAX_FILE_SIZE_BEFORE_COMPRESSION / 1024 / 1024}MB以下の画像ファイルを選択してください`)
    }
}

/**
 * 画像アップロードフォームのバリデーションスキーマ定義。
 * - imageUploadFormSchema: 画像アップロードフォームのバリデーション
 */
export const imageUploadFormSchema = z.object({
    menuType: z.string().min(1, "メニュータイプは必須です"),
    menuName: z.string().min(1, "メニュー名は必須です"),
    imageFile: z
        .instanceof(File, { message: "画像ファイルは必須です" })
        .refine(
            (file) => file?.type.startsWith('image/'),
            { message: "画像ファイルを選択してください" }
        )
        .optional()
})

/**
 * 画像アップロードフォームのバリデーションスキーマ定義。
 * - imageUploadFormSchema: 画像アップロードフォームのバリデーション
 */
export const imageEditFormSchema = z.object({
    menuType: z.string().min(1, "メニュータイプは必須です"),
    menuName: z.string().min(1, "メニュー名は必須です"),
    imageFile: z
        .instanceof(File, { message: "画像ファイルは必須です" })
        .refine(
            (file) => file?.type.startsWith('image/'),
            { message: "画像ファイルを選択してください" }
        )
        .optional()
})

export type ImageUploadFormValues = z.infer<typeof imageUploadFormSchema>
export type ImageEditFormValues = z.infer<typeof imageEditFormSchema>