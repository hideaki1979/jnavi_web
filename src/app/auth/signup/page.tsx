"use client"

import LoadingErrorContainer from "@/components/feedback/LoadingErrorContainer";
import dynamic from "next/dynamic";


const AuthForm = dynamic(() =>
    import("@/components/auth/AuthForm").then(mod => mod.AuthForm), {
    loading: () => <LoadingErrorContainer loading={true} />,
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
