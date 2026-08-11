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

/** {@link SignOutError} が起きた段階。復帰方法が段階ごとに異なるため区別する */
export type SignOutFailureStage =
    /** サーバー側のセッション破棄に失敗。まだログイン状態なので、そのまま再試行できる */
    | 'session'
    /** サーバー側は破棄済みだが、Firebaseのサインアウトに失敗。認証の実体は既に失効している */
    | 'client'

/**
 * サインアウトのどの段階で失敗したかを呼び出し側へ伝えるエラー。
 *
 * ログアウトは「サーバー側のセッション破棄」と「クライアント側のサインアウト」の
 * 2段階からなり、どちらで失敗したかによって取るべき復帰方法が逆になる。
 * これを区別しないと、サーバー側の破棄が済んでいるのに「再試行してください」と
 * 案内してしまい、実態と食い違った説明になる。
 */
export class SignOutError extends Error {
    readonly stage: SignOutFailureStage

    constructor(stage: SignOutFailureStage, message: string, options?: { cause?: unknown }) {
        super(message, options)
        this.name = 'SignOutError'
        this.stage = stage
    }
}

/**
 * サーバーにHttpOnlyのセッションクッキーを破棄させる。
 *
 * @throws {SignOutError} 破棄に失敗した場合（`stage: 'session'`）
 */
const destroySession = async (): Promise<void> => {
    let res: Response
    try {
        res = await fetch('/api/auth/session', { method: 'DELETE' })
    } catch (error) {
        throw new SignOutError('session', 'セッションの破棄に失敗しました。', { cause: error })
    }
    if (!res.ok) {
        throw new SignOutError('session', 'セッションの破棄に失敗しました。')
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
 * ユーザーからは気付けない状態になる。
 *
 * ただし2段階ある以上、サーバー側だけが済んだ中間状態は避けられない。
 * どちらで失敗したかは{@link SignOutError.stage}で判別できるので、
 * 呼び出し側はそれに応じた案内を出すこと。
 *
 * @throws {SignOutError} いずれかの段階で失敗した場合
 */
export const signOut = async (): Promise<void> => {
    await destroySession()
    try {
        await firebaseSignOut(auth)
    } catch (error) {
        // ここに来た時点でサーバー側のセッションは破棄済み。再試行しても
        // 失効させる対象はもう無いため、呼び出し側には別の案内をさせる。
        throw new SignOutError('client', 'ブラウザ側のサインアウトに失敗しました。', { cause: error })
    }
}