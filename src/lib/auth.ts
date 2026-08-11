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

/**
 * サーバーにHttpOnlyのセッションクッキーを破棄させる。
 *
 * @throws {Error} セッションクッキーの破棄に失敗した場合
 */
const destroySession = async (): Promise<void> => {
    const res = await fetch('/api/auth/session', { method: 'DELETE' })
    if (!res.ok) {
        throw new Error('セッションの破棄に失敗しました。')
    }
}

/**
 * サインアウト。
 *
 * クライアント側の`firebaseSignOut`だけではHttpOnlyのセッションクッキーが残り、
 * proxy（src/proxy.ts）が保護ルートへのアクセスを通し続けてしまうため、
 * 必ずサーバー側のセッション破棄とセットで行う（#80）。
 *
 * サーバー側を先に破棄するのは、通信に失敗したときの状態を一貫させるため。
 * 逆順だと「画面上はログアウト済みなのに保護ルートには入れる」という、
 * ユーザーからは気付けない状態になる。この順序なら失敗時はログイン状態のまま
 * 変わらないので、呼び出し側でエラーを伝えて再試行してもらえる。
 *
 * @throws {Error} セッションクッキーの破棄に失敗した場合
 */
export const signOut = async (): Promise<void> => {
    await destroySession()
    await firebaseSignOut(auth)
}