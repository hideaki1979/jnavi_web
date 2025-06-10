import { AuthForm } from "@/components/auth/AuthForm";

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
