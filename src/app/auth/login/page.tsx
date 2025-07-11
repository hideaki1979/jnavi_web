"use client"

import LoadingErrorContainer from "@/components/feedback/LoadingErrorContainer";
import dynamic from "next/dynamic";

const AuthForm = dynamic(() =>
    import("@/components/auth/AuthForm").then(mod => mod.AuthForm), {
    loading: () => <LoadingErrorContainer loading={true} />,
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
