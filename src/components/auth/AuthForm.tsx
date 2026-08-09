/**
 * ログイン・サインアップフォームのUI・認証処理コンポーネント。
 * - メール/パスワード認証、SNS認証、バリデーション、エラー表示等
 */
"use client"

import { createSession, signInWithEmail, signUpWithEmail } from "@/lib/auth"
import { LoginFormInput, loginSchema, SignupFormInput, signupSchema } from "@/validations/auth"
import { zodResolver } from "@hookform/resolvers/zod"
import { Alert, Box, Button, CircularProgress, Divider, IconButton, Typography } from "@mui/material"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Control, useForm } from "react-hook-form"
import { AuthFormInputText } from "./AuthFormInputText"
import { Email, Lock, Person } from "@mui/icons-material"
import Link from "next/link"
import { createUser } from "@/app/api/user"
import { unwrapActionResult } from "@/lib/actionResult"
import { handleFirebaseError } from "@/utils/firebaseErrorMessages"
import { AuthSocialButtons } from "./AuthSocialButtons"
import { auth } from "@/lib/firebase"
import { ValidationErrorList } from "../feedback/validationErrorList"
import { useApiError } from "@/hooks/useApiError"
import { useAsyncOperation } from "@/hooks/useAsyncOperation"
import { useAuthRedirect } from "@/hooks/useAuthRedirect"
import MapIcon from '@mui/icons-material/Map';

interface AuthFormProps {
    mode: 'login' | 'signup'
}

/**
 * @description
 * ログイン・サインアップフォームのUI・認証処理コンポーネント。
 * - メール/パスワード認証、SNS認証、バリデーション、エラー表示等
 * @param {AuthFormProps} props
 * @prop {string} mode login or signup
 * @returns {JSX.Element}
 */
export function AuthForm({ mode }: AuthFormProps) {
    // API エラーハンドリング（統一化）
    const { errorMessage, validationErrors, setError, clearErrors } = useApiError()
    const { isLoading: loading, execute: executeAuth } = useAsyncOperation<void>()
    const [successMsg, setSuccessMsg] = useState<string | null>(null)
    // proxy から渡される認証失敗理由・元ページへの復帰先
    const { redirectTo, authErrorMessage, redirectQuery } = useAuthRedirect()
    // 認証をやり直したら、リダイレクト時の案内は役目を終えるので隠す
    const [showAuthNotice, setShowAuthNotice] = useState(true)
    const router = useRouter()

    // アカウント作成成功メッセージを1.5秒見せてから遷移する。
    // タイマーはアンマウント時に解除し、その間にユーザーが自分で
    // 別画面へ移動した場合にその操作を上書きしないようにする。
    useEffect(() => {
        if (!successMsg) return
        const timer = setTimeout(() => router.replace(redirectTo), 1500)
        return () => clearTimeout(timer)
    }, [successMsg, redirectTo, router])

    const isSignup = mode === 'signup'
    const schema = isSignup ? signupSchema : loginSchema

    const { control, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(schema),
        defaultValues: isSignup
            ? { name: "", email: "", password: "", confirmPassword: "" }
            : { email: "", password: "" }
    })

    /**
     * @description
     * 認証フォームの送信ハンドラ。
     * - サインアップ：メール/パスワード認証、ユーザー作成
     * - ログイン：メール/パスワード認証、認証成功でredirect_to（無ければstores/map）に遷移
     * - エラーハンドリング：Firebaseのエラーメッセージを表示
     * @param {LoginFormInput | SignupFormInput} data
     * @returns {Promise<void>}
     */
    const onSubmit = async (data: LoginFormInput | SignupFormInput) => {
        clearErrors()   // 送信前にエラークリア
        setShowAuthNotice(false)

        try {
            await executeAuth(async () => {
                if (isSignup) {
                    const signUpData = data as SignupFormInput
                    const user = await signUpWithEmail(signUpData.name, signUpData.email, signUpData.password)
                    const idToken = await auth.currentUser?.getIdToken()
                    if (!idToken) throw new Error('認証トークンの取得に失敗しました。')

                    // Server Actionは失敗時も結果オブジェクトを返すため、ここで例外化する
                    unwrapActionResult(await createUser({
                        uid: user.uid,
                        email: signUpData.email,
                        displayName: signUpData.name,
                        authProvider: 'email'
                    }, idToken))

                    // サーバーにIDトークンを送信してセッションクッキーを設定
                    await createSession(idToken)
                    // 遷移は successMsg を監視する useEffect 側で行う（タイマー解除のため）
                    setSuccessMsg("アカウント作成が成功しました。")

                } else {
                    const loginData = data as LoginFormInput
                    await signInWithEmail(loginData.email, loginData.password)
                    const idToken = await auth.currentUser?.getIdToken()
                    if (!idToken) throw new Error('認証トークンの取得に失敗しました。')
                    // サーバーにIDトークンを送信してセッションクッキーを設定
                    await createSession(idToken)
                    router.replace(redirectTo)
                }
            })
        } catch (err) {
            // Firebaseエラーの場合は専用ハンドラを使用
            const firebaseErrorMsg = handleFirebaseError(err)

            // express-validationのエラー配列があれば追加
            if (typeof err === "object" && err !== null && "errors" in err && Array.isArray(err.errors)) {
                // ApiClientError形式に変換してsetError関数に渡す
                const apiError = {
                    name: 'ApiClientError',
                    message: firebaseErrorMsg,
                    errors: err.errors
                }
                setError(apiError)
            } else {
                setError(new Error(firebaseErrorMsg))
            }
        }
    }

    // エラーハンドリング関数をAuthSocialButtonsに渡すためのラッパー
    const handleSocialError = (errorMsg: string) => {
        setError(new Error(errorMsg))
    }

    const handleSocialValidationErrors = (errors: { msg: string, param?: string }[]) => {
        const apiError = {
            name: 'ApiClientError',
            message: '認証エラーが発生しました',
            errors: errors
        }
        setError(apiError)
    }


    return (
        <Box
            component="form"
            // 第2引数はクライアント検証で弾かれた時のハンドラ（onSubmitに入らないためここでもAPIエラーを消す）
            onSubmit={handleSubmit(onSubmit, clearErrors)}
            sx={{
                maxWidth: 540,
                mx: "auto",
                my: 4,
                p: 4,
                backgroundColor: "grey.300",
                color: "grey.700",
                borderRadius: 2,
                boxShadow: 2,
                height: "88vh",
                overflowY: "auto"
            }}
        >
            {/* タイトルとMapアイコンを横並びに配置 */}
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    mb: 2
                }}
            >
                <Typography variant="h5" fontWeight="bold" textAlign="center">
                    {isSignup ? "アカウント作成" : "ログイン"}
                </Typography>
                <IconButton
                    sx={{
                        position: "absolute",
                        right: 0,
                        "&:hover": {
                            backgroundColor: "primary.light",
                            color: "black"
                        }
                    }}
                    title="マップ画面"
                    onClick={() => router.push('/stores/map')}
                >
                    <MapIcon />
                </IconButton>

            </Box>

            {/* proxyからのリダイレクト理由（認証失敗・セッション切れ）の案内 */}
            {showAuthNotice && authErrorMessage && (
                <Alert severity="warning" sx={{ mt: 4, fontSize: 12 }}>
                    {authErrorMessage}
                </Alert>
            )}

            {/* エラーメッセージ表示（統一化） */}
            {errorMessage && (
                <Alert severity="error" sx={{ mt: 4, fontSize: 12 }}>
                    {errorMessage}
                </Alert>
            )}

            {/* バリデーションエラー表示（統一化） */}
            <ValidationErrorList errors={validationErrors} />

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
                sx={{ mt: 2, mb: 2, py: 2, fontWeight: "bold" }}
            >
                {loading ? <CircularProgress size={24} color="inherit" /> : (isSignup ? "アカウント作成" : "ログイン")}
            </Button>
            {/* ログイン⇔アカウント作成を行き来しても復帰先を失わないようredirect_toを引き継ぐ */}
            {isSignup
                ? (<Typography textAlign="center">
                    作成済の方は
                    <Link href={`/auth/login${redirectQuery}`} className="text-blue-600 ml-2 font-bold">
                        ログイン
                    </Link>
                </Typography>)
                : (<Typography textAlign="center">
                    アカウント作成は
                    <Link href={`/auth/signup${redirectQuery}`} className="text-blue-600 ml-2 font-bold">
                        こちら
                    </Link>
                </Typography>)
            }
            <Divider sx={{ my: 2 }} textAlign="center" >または</Divider>
            <AuthSocialButtons
                redirectTo={redirectTo}
                onAuthStart={() => setShowAuthNotice(false)}
                onError={handleSocialError}
                onErrors={handleSocialValidationErrors}
            />
        </Box>
    )
}