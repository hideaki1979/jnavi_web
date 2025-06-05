import { z } from "zod";

export const loginSchema = z.object({
    email: z.string().email("正しいメールアドレスを入力してください"),
    password: z.string().min(8, "パスワードは8文字以上で入力してください")
})

export const signupSchema = z.object({
    name: z.string().min(1, "名前は必須です"),
    email: z.string().email("正しいメールアドレスを入力してください"),
    password: z.string().min(8, "パスワードは6文字以上で入力してください"),
    confirmPassword: z.string().min(8, "確認用パスワードは6文字以上で入力してください")
}).refine((data) => data.password === data.confirmPassword, {
    message: "パスワードと確認用パスワードが一致していません",
    path: ["confirmPassword"]
})

export type LoginFormInput = z.infer<typeof loginSchema>
export type SignupFormInput = z.infer<typeof signupSchema>