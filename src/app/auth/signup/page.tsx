import { AuthForm } from "@/components/auth/AuthForm";

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
