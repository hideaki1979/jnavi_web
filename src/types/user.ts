/**
 * ユーザー情報の型定義。
 * Firebase Authenticationユーザー情報を含む。
 */

// ユーザー型定義
export interface User {
    uid: string;
    email: string | null;
    displayName: string | null;
    authProvider?: string;
    bio?: string;
}