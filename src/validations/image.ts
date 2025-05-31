import { z } from "zod";

export const imageUploadFormSchema = z.object({
    menuType: z.string().min(1, "メニュータイプは必須です"),
    menuName: z.string().min(1, "メニュー名は必須です"),
    imageFile: z
        .instanceof(File, { message: "画像ファイルは必須です" })
})

export type ImageUploadFormValues = z.infer<typeof imageUploadFormSchema>