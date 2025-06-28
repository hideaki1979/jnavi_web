export interface FirebaseErrorMessageMap {
    // 認証関連エラー
    'auth/invalid-credential': string;
    'auth/user-not-found': string;
    'auth/wrong-password': string;
    'auth/invalid-email': string;
    'auth/user-disabled': string;
    'auth/email-already-in-use': string;
    'auth/weak-password': string;
    'auth/operation-not-allowed': string;
    'auth/account-exists-with-different-credential': string;
    'auth/requires-recent-login': string;
    'auth/credential-already-in-use': string;
    'auth/timeout': string;
    'auth/network-request-failed': string;
    'auth/too-many-requests': string;
    'auth/popup-closed-by-user': string;
    'auth/cancelled-popup-request': string;
    'auth/popup-blocked': string;
    'auth/internal-error': string;
    'permission-denied': string;
    'unavailable': string;
    [key: string]: string; // その他のエラー
}