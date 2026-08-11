"use client"

import { createUser, getUserByUid } from "@/app/api/user";
import { unwrapActionResult } from "@/lib/actionResult";
import { createSession, signInWithFacebook, signInWithGitHub, signInWithGoogle } from "@/lib/auth"
import { auth } from "@/lib/firebase";
import { User } from "@/types/user";
import { handleFirebaseError } from "@/utils/firebaseErrorMessages";
import { DEFAULT_REDIRECT_PATH } from "@/utils/redirectPath";
import { Facebook, GitHub, Google } from "@mui/icons-material"
import { Box, Button } from "@mui/material"
import { useRouter } from "next/navigation"
import { useState } from "react";

interface AuthSocialButtonsProps {
    redirectTo?: string;
    onAuthStart?: () => void;
    onError?: (error: string) => void;
    onErrors?: (errors: { msg: string, param?: string }[]) => void;
}

/**
 * SNS認証（Google, Facebook, Github）用ボタンコンポーネント。
 * -各SNS認証のハンドリング、ユーザー作成・取得処理
 * @param {AuthSocialButtonsProps} props
 * @prop {string} [redirectTo] 認証成功後の遷移先。呼び出し側で検証済みのパスを渡すこと。既定は`/stores/map`
 * @prop {() => void} [onAuthStart] 認証開始時に呼ばれるコールバック
 * @prop {(error: string) => void} [onError] エラーハンドリング関数、Firebaseのエラーメッセージを引数に受け取ります。
 * @prop {({ msg: string, param?: string }[]) => void} [onErrors] エラーハンドリング関数、Firebaseのエラーメッセージの配列を引数に受け取ります。
 */
export function AuthSocialButtons({
    redirectTo = DEFAULT_REDIRECT_PATH,
    onAuthStart,
    onError,
    onErrors
}: AuthSocialButtonsProps) {
    const router = useRouter()
    const [loading, setLoading] = useState<string | null>(null)

    const handleSocialAuth = async (
        provider: 'google' | 'facebook' | 'github',
        signInFunction: () => Promise<User>
    ) => {
        setLoading(provider)
        onAuthStart?.()
        try {
            const user = await signInFunction()
            const idToken = await auth.currentUser?.getIdToken()
            if (!idToken) throw new Error('認証トークンの取得に失敗しました。')
            // 取得に失敗した場合（未登録ユーザーの404を含む）は未登録として扱い、新規登録を試みる
            const userResult = await getUserByUid(user.uid, idToken)
            const userData = userResult.success ? userResult.data : null

            if (!userData) {
                // Server Actionは失敗時も結果オブジェクトを返すため、ここで例外化する
                unwrapActionResult(await createUser({
                    uid: user.uid,
                    email: user.email ?? '',
                    displayName: user.displayName ?? '',
                    authProvider: provider
                }, idToken))
            }

            // 遷移前にセッションクッキーを発行する。
            // これが無いと復帰先が保護ルートの場合、proxy にログイン画面へ差し戻される。
            await createSession(idToken)

            router.replace(redirectTo)
        } catch (error) {
            // 失敗時はボタンを再度押せるようにローディングを解除する
            // （成功時は遷移するため解除しない）
            setLoading(null)
            const errMsg = handleFirebaseError(error)
            onError?.(errMsg)
            // errors配列があればセット
            if (typeof error === 'object' && error !== null && 'errors' in error && Array.isArray(error.errors)) {
                onErrors?.(error.errors)
            }
        }
    }

    const handleGoogleAuth = () => handleSocialAuth('google', signInWithGoogle)
    const handleFacebookAuth = () => handleSocialAuth('facebook', signInWithFacebook)
    const handleGitHubAuth = () => handleSocialAuth('github', signInWithGitHub)

    return (
        <Box display="flex" flexDirection="column" gap={2}>
            <Button
                variant="contained"
                fullWidth
                startIcon={<Google />}
                onClick={handleGoogleAuth}
                sx={{
                    py: 1.5,
                    backgroundColor: '#ffffff',
                    color: '#1f1f1f',
                    border: '1px solid #dadce0',
                    boxShadow: 'none',
                    '&:hover': {
                        backgroundColor: '#f8f9fa',
                        boxShadow: '0 1px 2px 0 rgba(60,64,67,.30), 0 1px 3px 1px rgba(60,64,67,.15)',
                    },
                    '&:active': {
                        backgroundColor: '#f1f3f4',
                    },
                    '&:disabled': {
                        backgroundColor: '#f8f9fa',
                        color: '#5f6368',
                    },
                    '& .MuiButton-startIcon': {
                        color: '#4285f4', // Google blue for icon
                    }
                }}
                // 処理中のプロバイダに関わらず全ボタンを無効化する
                disabled={loading !== null}
                // スピナー表示は自分が処理中のときのみ。
                // MUIの`loading`propによりローディング中もボタンのアクセシブルな名前が保たれる
                loading={loading === 'google'}
            >
                Googleでログイン
            </Button>
            <Button
                variant="contained"
                fullWidth
                startIcon={<Facebook />}
                onClick={handleFacebookAuth}
                disabled={loading !== null}
                loading={loading === 'facebook'}
                sx={{
                    py: 1.5,
                    backgroundColor: '#1877F2',
                    color: '#ffffff',
                    '&:hover': {
                        backgroundColor: '#166FE5',
                        boxShadow: '0 2px 4px 0 rgba(0,0,0,0.2), 0 3px 10px 0 rgba(0,0,0,0.19)',
                    },
                    '&:active': {
                        backgroundColor: '#1464D6',
                    },
                    '&:disabled': {
                        backgroundColor: '#E4E6EA',
                        color: '#BEC3C9',
                    }
                }}
            >
                Facebookでログイン
            </Button>
            <Button
                variant="contained"
                fullWidth
                startIcon={<GitHub />}
                onClick={handleGitHubAuth}
                disabled={loading !== null}
                loading={loading === 'github'}
                sx={{
                    py: 1.5,
                    backgroundColor: '#24292e',
                    color: '#ffffff',
                    '&:hover': {
                        backgroundColor: '#1c2025',
                        opacity: 0.8,
                    },
                    '&:active': {
                        backgroundColor: '#181b20',
                    },
                    '&:disabled': {
                        backgroundColor: '#f6f8fa',
                        color: '#959da5',
                    }
                }}
            >
                Githubでログイン
            </Button>
        </Box>
    )
}