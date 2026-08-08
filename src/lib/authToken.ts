/**
 * バックエンドAPIの認証（Authorizationヘッダー / Bearerトークン）用にIDトークンを取得するモジュール。
 *
 * ログイン処理を集めた lib/auth.ts とは意図的に分離している。
 * lib/auth.ts は signInWithPopup など認証画面専用の処理を静的importしており、
 * データ更新フックから参照するとログイン画面以外にも不要なバンドルが載るため。
 */

/**
 * ログイン中ユーザーのIDトークンを取得する。
 * バックエンドの認証必須エンドポイント（店舗の登録・更新・閉店、画像の登録・更新・削除）を
 * 呼び出す際に使用する。有効期限が近い場合はFirebase SDKが自動で再取得する。
 *
 * firebaseを動的importにしているのは、読み取り専用の画面も同じフック経由でこのモジュールを
 * 読み込むため。静的importにすると更新処理を行わない画面の初期バンドルまで増える。
 *
 * @returns Firebase IDトークン
 * @throws 未ログイン、またはトークン取得に失敗した場合
 */
export const getCurrentUserIdToken = async (): Promise<string> => {
    const { auth } = await import("./firebase")
    if (!auth.currentUser) {
        throw new Error('ユーザーがログインしていません。再度ログインしてください。')
    }
    const idToken = await auth.currentUser.getIdToken()
    if (!idToken) {
        throw new Error('認証トークンの取得に失敗しました。')
    }
    return idToken
}
