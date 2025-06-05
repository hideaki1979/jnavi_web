"use client"

import { signInWithEmail, signUpWithEmail } from "@/lib/auth"
import { LoginFormInput, loginSchema, SignupFormInput, signupSchema } from "@/validations/auth"
import { zodResolver } from "@hookform/resolvers/zod"
import { Alert, Box, Button, CircularProgress, Divider, Typography } from "@mui/material"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Control, useForm } from "react-hook-form"
import { AuthFormInputText } from "./AuthFormInputText"
import { Email, Lock, Person } from "@mui/icons-material"
import Link from "next/link"
import { createUser } from "@/app/api/user"
import { handleFirebaseError } from "@/utils/firebaseErrorMessages"
import { AuthSocialButtons } from "./AuthSocialButtons"
import { auth } from "@/lib/firebase"

interface AuthFormProps {
    mode: 'login' | 'signup'
}

export function AuthForm({ mode }: AuthFormProps) {
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [successMsg, setSuccessMsg] = useState<string | null>(null)
    const router = useRouter()

    const isSignup = mode === 'signup'
    const schema = isSignup ? signupSchema : loginSchema

    const { control, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(schema),
        defaultValues: isSignup
            ? { name: "", email: "", password: "", confirmPassword: "" }
            : { email: "", password: "" }
    })

    const onSubmit = async (data: LoginFormInput | SignupFormInput) => {
        setLoading(true)
        setError(null)

        try {
            if (isSignup) {
                const signUpData = data as SignupFormInput
                const user = await signUpWithEmail(signUpData.name, signUpData.email, signUpData.password)
                const idToken = await auth.currentUser?.getIdToken()
                if (!idToken) throw new Error('認証トークンの取得に失敗しました。')

                await createUser({
                    uid: user.uid,
                    email: signUpData.email,
                    displayName: signUpData.name,
                    authProvider: 'email'
                }, idToken)
                setSuccessMsg("アカウント作成が成功しました。")
                setTimeout(() => router.replace(`/auth/login`), 1500)

            } else {
                const loginData = data as LoginFormInput
                await signInWithEmail(loginData.email, loginData.password)
                router.replace(`/stores/map`)

            }
        } catch (error) {
            const errMsg = handleFirebaseError(error)
            setError(errMsg)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Box
            component="form"
            onSubmit={handleSubmit(onSubmit)}
            sx={{ maxWidth: 540, mx: "auto", p: 4, backgroundColor: "grey.300", color: "grey.700" }}
        >
            <Typography variant="h5" fontWeight="bold" textAlign="center">
                {isSignup ? "アカウント作成" : "ログイン"}
            </Typography>
            {error && (
                <Alert severity="error" sx={{ mt: 4, fontSize: 12 }}>
                    {error}
                </Alert>
            )}
            {isSignup && (
                <AuthFormInputText<SignupFormInput>
                    name="name"
                    control={control as Control<SignupFormInput>}
                    label="アカウント名"
                    required
                    errors={errors}
                    startAdornment={<Person />}
                />
            )}
            <AuthFormInputText<SignupFormInput | LoginFormInput>
                name="email"
                control={control}
                label="メールアドレス"
                type="email"
                required
                errors={errors}
                startAdornment={<Email />}
            />
            <AuthFormInputText<SignupFormInput | LoginFormInput>
                name="password"
                control={control}
                label="パスワード"
                type="password"
                required
                errors={errors}
                startAdornment={<Lock />}
                endAdornment
            />
            {isSignup && (
                <AuthFormInputText<SignupFormInput>
                    name="confirmPassword"
                    control={control as Control<SignupFormInput>}
                    label="確認用パスワード"
                    type="password"
                    required
                    errors={errors}
                    startAdornment={<Lock />}
                    endAdornment
                />
            )}
            {successMsg && (
                <Alert severity="success" className="my-4" variant="filled">
                    {successMsg}
                </Alert>
            )}

            <Button type="submit" variant="contained" fullWidth disabled={loading}
                sx={{ mt: 4, mb: 4, py: 2, fontWeight: "bold" }}
            >
                {loading ? <CircularProgress size={24} color="inherit" /> : (isSignup ? "アカウント作成" : "ログイン")}
            </Button>
            {isSignup
                ? (<Typography textAlign="center">
                    作成済の方は
                    <Link href="/auth/login" className="text-blue-600 ml-2 font-bold">
                        ログイン
                    </Link>
                </Typography>)
                : (<Typography textAlign="center">
                    アカウント作成は
                    <Link href="/auth/signup" className="text-blue-600 ml-2 font-bold">
                        こちら
                    </Link>
                </Typography>)
            }
            <Divider sx={{ my: 2 }} textAlign="center" >または</Divider>
            <AuthSocialButtons />
        </Box>
    )
}