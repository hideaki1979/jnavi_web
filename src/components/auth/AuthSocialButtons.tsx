"use client"

import { createUser, getUserByUid } from "@/app/api/user";
import { signInWithFacebook, signInWithGitHub, signInWithGoogle } from "@/lib/auth"
import { auth } from "@/lib/firebase";
import { User } from "@/types/user";
import { handleFirebaseError } from "@/utils/firebaseErrorMessages";
import { Facebook, GitHub, Google } from "@mui/icons-material"
import { Box, Button, CircularProgress } from "@mui/material"
import { useRouter } from "next/navigation"
import { useState } from "react";

interface AuthSocialButtonsProps {
    onError?: (error: string) => void;
    onErrors?: (errors: { msg: string, param?: string }[]) => void;
}

/**
 * SNS認証（Google, Facebook, Github）用ボタンコンポーネント。
 * -各SNS認証のハンドリング、ユーザー作成・取得処理
 * @param {AuthSocialButtonsProps} props
 * @prop {string} [onError] エラーハンドリング関数、Firebaseのエラーメッセージを引数に受け取ります。
 * @prop {({ msg: string, param?: string }[]) => void} [onErrors] エラーハンドリング関数、Firebaseのエラーメッセージの配列を引数に受け取ります。
 */
export function AuthSocialButtons({ onError, onErrors }: AuthSocialButtonsProps) {
    const router = useRouter()
    const [loading, setLoading] = useState<string | null>(null)

    const handleSocialAuth = async (
        provider: 'google' | 'facebook' | 'github',
        signInFunction: () => Promise<User>
    ) => {
        setLoading(provider)
        try {
            const user = await signInFunction()
            const idToken = await auth.currentUser?.getIdToken()
            if (!idToken) throw new Error('認証トークンの取得に失敗しました。')
            const userData = await getUserByUid(user.uid, idToken)

            if (!userData) {
                await createUser({
                    uid: user.uid,
                    email: user.email ?? '',
                    displayName: user.displayName ?? '',
                    authProvider: provider
                }, idToken)
            }

            router.replace(`/stores/map`)
        } catch (error) {
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
                disabled={loading !== null}
            >
                {loading === 'google' ? <CircularProgress size={24} sx={{ color: '#4285f4' }} /> : 'Googleでログイン'}
            </Button>
            <Button
                variant="contained"
                fullWidth
                startIcon={<Facebook />}
                onClick={handleFacebookAuth}
                disabled={loading !== null}
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
                {loading === 'facebook' ? <CircularProgress size={24} color="inherit" /> : 'Facebookでログイン'}
            </Button>
            <Button
                variant="contained"
                fullWidth
                startIcon={<GitHub />}
                onClick={handleGitHubAuth}
                disabled={loading !== null}
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
                {loading === 'github' ? <CircularProgress size={24} color="inherit" /> : 'Githubでログイン'}
            </Button>
        </Box>
    )
}