export type KnownFirebaseAuthErrors =
    // 認証関連エラー
    | 'auth/invalid-credential'
    | 'auth/user-not-found'
    | 'auth/wrong-password'
    | 'auth/invalid-email'
    | 'auth/user-disabled'
    | 'auth/email-already-in-use'
    | 'auth/weak-password'
    | 'auth/operation-not-allowed'
    | 'auth/account-exists-with-different-credential'
    | 'auth/requires-recent-login'
    | 'auth/credential-already-in-use'
    | 'auth/timeout'
    | 'auth/network-request-failed'
    | 'auth/too-many-requests'
    | 'auth/popup-closed-by-user'
    | 'auth/cancelled-popup-request'
    | 'auth/popup-blocked'
    | 'auth/internal-error'
    | 'permission-denied'
    | 'unavailable'

// インターセクション型で既知コードを必須、その他を任意に
export type FirebaseErrorMessageMap =
    Record<KnownFirebaseAuthErrors, string> & { [key: string]: string }