/**
 * Firebase認証エラーコードを日本語メッセージに変換するユーティリティ。
 * - getFirebaseAuthErrorMessage: エラーコードを日本語メッセージに変換
 * - handleFirebaseError: Firebaseエラーオブジェクトから日本語メッセージを取得
 */

import { FirebaseErrorMessageMap } from "@/types/firebase";

/**
 * Firebaseの認証エラーコードを日本語メッセージに変換する
 */
export function getFirebaseAuthErrorMessage(errorCode: string): string {
    const errorMessages: FirebaseErrorMessageMap = {
        // 認証関連エラー
        'auth/invalid-credential': 'メールアドレスまたはパスワードが正しくありません。',
        'auth/user-not-found': 'このメールアドレスで登録されたアカウントが見つかりません。',
        'auth/wrong-password': 'パスワードが正しくありません。',
        'auth/invalid-email': 'メールアドレスの形式が正しくありません。',
        'auth/user-disabled': 'このアカウントは無効化されています。',
        'auth/email-already-in-use': 'このメールアドレスは既に使用されています。',
        'auth/weak-password': 'パスワードが弱すぎます。6文字以上で入力してください。',
        'auth/operation-not-allowed': 'この操作は許可されていません。',
        'auth/account-exists-with-different-credential': '異なる認証方法で同じメールアドレスが既に登録されています。',
        'auth/requires-recent-login': 'この操作には再度ログインが必要です。',
        'auth/credential-already-in-use': 'この認証情報は既に別のアカウントで使用されています。',
        'auth/timeout': '認証がタイムアウトしました。再度お試しください。',
        'auth/network-request-failed': 'ネットワークエラーが発生しました。インターネット接続を確認してください。',
        'auth/too-many-requests': 'リクエストが多すぎます。しばらく時間をおいてから再度お試しください。',
        'auth/popup-closed-by-user': '認証ウィンドウが閉じられました。',
        'auth/cancelled-popup-request': '認証リクエストがキャンセルされました。',
        'auth/popup-blocked': 'ポップアップがブロックされました。ブラウザの設定を確認してください。',

        // その他の一般的なエラー
        'auth/internal-error': '内部エラーが発生しました。しばらく時間をおいてから再度お試しください。',
        'permission-denied': 'アクセス権限がありません。',
        'unavailable': 'サービスが一時的に利用できません。しばらく時間をおいてから再度お試しください。',
    };

    return errorMessages[errorCode] || '予期せぬエラーが発生しました。しばらく時間をおいてから再度お試しください。';
}

/**
 * Firebaseエラーオブジェクトから日本語メッセージを取得する
 */
export function handleFirebaseError(error: unknown): string {
    // Firebaseエラーの場合
    if (error && typeof error === 'object' && 'code' in error && typeof error.code === 'string') {
        return getFirebaseAuthErrorMessage(error.code);
    }

    // 一般的なエラーの場合
    if (error instanceof Error) {
        return error.message;
    }

    // その他の場合
    return '予期せぬエラーが発生しました。';
}