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
            // console.log(JSON.stringify(user, null, 2))
            // console.log(user.uid)
            // console.log(user.email)
            // console.log(user.displayName)
            // console.log(user.authProvider)

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
                variant="outlined"
                fullWidth
                startIcon={<Google />}
                onClick={handleGoogleAuth}
                sx={{ py: 1.5 }}
                disabled={loading !== null}
            >
                {loading === 'google' ? <CircularProgress size={24} color="inherit" /> : 'Googleでログイン'}
            </Button>
            <Button
                variant="outlined"
                fullWidth
                startIcon={<Facebook />}
                onClick={handleFacebookAuth}
                disabled={loading !== null}
                sx={{ py: 1.5 }}
            >
                {loading === 'facebook' ? <CircularProgress size={24} color="inherit" /> : 'Facebookでログイン'}
            </Button>
            <Button
                variant="outlined"
                fullWidth
                startIcon={<GitHub />}
                onClick={handleGitHubAuth}
                disabled={loading !== null}
                sx={{ py: 1.5 }}
            >
                {loading === 'github' ? <CircularProgress size={24} color="inherit" /> : 'Githubでログイン'}
            </Button>
        </Box>
    )
}