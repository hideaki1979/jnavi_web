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
 * ログインページ。
 * AuthFormコンポーネントをmode="login"に設定して、ログインフォームを提供。
 * @returns {JSX.Element} ログインフォームを含むJSX.Element
 */
export default function LoginPage() {
    return (
        <AuthForm mode="login" />
    )
}
