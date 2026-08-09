"use client"

import LoadingErrorContainer from "@/components/feedback/LoadingErrorContainer";
import dynamic from "next/dynamic";
import { Suspense } from "react";

const AuthForm = dynamic(() =>
    import("@/components/auth/AuthForm").then(mod => mod.AuthForm), {
    loading: () => <LoadingErrorContainer loading={true} />,
    ssr: false
})


/**
 * ログインページ。
 * AuthFormコンポーネントをmode="login"に設定して、ログインフォームを提供。
 * AuthFormは`useSearchParams()`で`redirect_to`/`error`を読むため、Suspense境界で囲む。
 * @returns {JSX.Element} ログインフォームを含むJSX.Element
 */
export default function LoginPage() {
    return (
        <Suspense fallback={<LoadingErrorContainer loading={true} />}>
            <AuthForm mode="login" />
        </Suspense>
    )
}
