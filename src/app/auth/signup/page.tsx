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
 * サインアップページ。
 * - AuthFormコンポーネントにmode=signupを渡し、サインアップフォームを表示
 * - サインアップフォームのUI・認証処理をAuthFormコンポーネントに任せる
 * - AuthFormは`useSearchParams()`で`redirect_to`を読むため、Suspense境界で囲む
 */
export default function SignupPage() {
    return (
        <Suspense fallback={<LoadingErrorContainer loading={true} />}>
            <AuthForm mode="signup" />
        </Suspense>
    )
}
