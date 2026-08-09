/**
 * Firebase Authenticationを利用した認証・ユーザー管理のための関数群。
 * - Google/Facebook/Github認証
 * - メールアドレスによるサインアップ・ログイン
 * - セッションクッキーの作成
 * - サインアウト
 */
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, updateProfile, User, signOut as firebaseSignOut } from "firebase/auth";
import { auth, facebookProvider, githubProvider, googleProvider } from "./firebase";

// Google認証
export const signInWithGoogle = async (): Promise<User> => {
    const result = await signInWithPopup(auth, googleProvider)
    return result.user
}

// Facebook認証
export const signInWithFacebook = async (): Promise<User> => {
    const result = await signInWithPopup(auth, facebookProvider)
    return result.user
}

// Github認証
export const signInWithGitHub = async (): Promise<User> => {
    const result = await signInWithPopup(auth, githubProvider)
    return result.user
}

// メール・パスワード登録
export const signUpWithEmail = async (name: string, email: string, password: string): Promise<User> => {
    const result = await createUserWithEmailAndPassword(auth, email, password)
    const user = result.user
    await updateProfile(user, { displayName: name })
    return user
}

// メール・パスワードログイン
export const signInWithEmail = async (email: string, password: string): Promise<User> => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
};

/**
 * IDトークンをサーバーに送信し、HttpOnlyのセッションクッキーを発行させる。
 *
 * このクッキーが無いと proxy（src/proxy.ts）が保護ルートへのアクセスを
 * ログイン画面へ差し戻すため、認証成功後の画面遷移より前に必ず呼ぶこと。
 *
 * @param idToken Firebaseから取得したIDトークン
 * @throws {Error} セッションクッキーの発行に失敗した場合
 */
export const createSession = async (idToken: string): Promise<void> => {
    const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`
        }
    })
    if (!res.ok) {
        throw new Error('セッションの作成に失敗しました。')
    }
}

// サインアウト
export const signOut = async (): Promise<void> => {
    await firebaseSignOut(auth)
}