"use client"

import { Box, CircularProgress } from "@mui/material";
import dynamic from "next/dynamic";


const AuthForm = dynamic(() =>
    import("@/components/auth/AuthForm").then(mod => mod.AuthForm), {
    loading: () => (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <CircularProgress size="3rem" />
        </Box>
    ),
    ssr: false
})

/**
 * サインアップページ。
 * - AuthFormコンポーネントにmode=signupを渡し、サインアップフォームを表示
 * - サインアップフォームのUI・認証処理をAuthFormコンポーネントに任せる
 */
export default function SignupPage() {
    return (
        <AuthForm mode="signup" />
    )
}
