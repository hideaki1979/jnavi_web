// ユーザー型定義
export interface User {
    uid: string;
    email: string | null;
    displayName: string | null;
    authProvider?: string;
}