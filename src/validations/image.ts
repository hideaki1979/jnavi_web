import { z } from "zod";

// 圧縮前のファイルサイズ制限（20MB）
const MAX_FILE_SIZE_BEFORE_COMPRESSION = 20 * 1024 * 1024;

/**
 * サーバが受け付ける画像MIMEタイプ。
 * サーバ側の Base64 検証（imageValidation.ts）と ImageService の許可リストに揃えること。
 * ここに無い形式（HEIC/HEIF・SVG など）を送ると 400 になる。
 */
export const ALLOWED_IMAGE_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
] as const

/**
 * アップロード時に変換する出力形式。
 * iPhone の HEIC/HEIF や、環境によって付与される image/jpg を JPEG に正規化するために使用する。
 */
export const IMAGE_OUTPUT_MIME_TYPE = 'image/jpeg'

/**
 * 圧縮前のファイルサイズをチェック
 */
export const validateFileSizeBeforeCompression = (file: File) => {
    if (file.size > MAX_FILE_SIZE_BEFORE_COMPRESSION) {
        throw new Error(`ファイルサイズが許容サイズを超えてます。${MAX_FILE_SIZE_BEFORE_COMPRESSION / 1024 / 1024}MB以下の画像ファイルを選択してください`)
    }
}

/**
 * 画像ファイル共通のバリデーションスキーマ。
 * 変換後のファイルはサーバの許可リストに含まれるMIMEタイプである必要がある。
 */
const imageFileSchema = z
    .instanceof(File)
    .refine(
        (file) => (ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(file?.type),
        { message: "画像はJPEG、PNG、GIF、WEBP形式のファイルを選択してください" }
    )
    .optional()

/**
 * 画像アップロードフォームのバリデーションスキーマ定義。
 * - imageUploadFormSchema: 画像アップロードフォームのバリデーション
 */
export const imageUploadFormSchema = z.object({
    menuType: z.string().min(1, "メニュータイプは必須です"),
    menuName: z.string().trim().min(1, "メニュー名は必須です"),
    imageFile: imageFileSchema
})

/**
 * 画像編集フォームのバリデーションスキーマ定義。
 * - imageEditFormSchema: 画像編集フォームのバリデーション
 */
export const imageEditFormSchema = z.object({
    menuType: z.string().min(1, "メニュータイプは必須です"),
    menuName: z.string().trim().min(1, "メニュー名は必須です"),
    imageFile: imageFileSchema
})

export type ImageUploadFormValues = z.infer<typeof imageUploadFormSchema>
export type ImageEditFormValues = z.infer<typeof imageEditFormSchema>
