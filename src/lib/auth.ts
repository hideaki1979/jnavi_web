/**
 * Firebase Authenticationを利用した認証・ユーザー管理のための関数群。
 * - Google/Facebook/Github認証
 * - メールアドレスによるサインアップ・ログイン
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

// サインアウト
export const signOut = async (): Promise<void> => {
    await firebaseSignOut(auth)
}