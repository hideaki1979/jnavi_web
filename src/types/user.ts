/**
 * ユーザー情報の型定義。
 *
 * 「アプリ内のユーザー情報」「登録APIへ送る形」「APIが返す形」は
 * それぞれ別物なので、混ぜずに3つの型に分けている。
 */

/**
 * このアプリが参照する Firebase Authentication のユーザー情報。
 *
 * `firebase/auth` の `User` から構造的にそのまま代入できる項目だけを並べたもので、
 * サインイン関数（`src/lib/auth.ts` の`signInWithGoogle`等）の戻り値を受ける用途で使う。
 *
 * **APIのリクエスト／レスポンスの型ではない。**
 * - `POST /users` へ送る形は {@link CreateUserInput}
 * - APIが返す形は {@link ApiUser}（スネークケース）
 */
export interface User {
    uid: string;
    email: string | null;
    displayName: string | null;
}

/**
 * ユーザー登録API（`POST /users`）のリクエストボディ。
 *
 * バックエンドの zod スキーマ（`userInputSchema`）に対応する。
 * 全項目が任意で、未指定の項目は null として登録される。
 *
 * `uid`を持たないのは、バックエンドが検証済みトークンからUIDを取り直すため
 * （他ユーザーのUIDでのレコード作成を防ぐ仕様）。送っても無視される。
 *
 * どの項目も**null は受け付けない**。zod 側が`.optional()`のみで`.nullable()`ではないため、
 * null を送ると 400 になる。値が無いときは null を入れずキーごと省略すること
 * （同じ理由で、空文字も`email`では 400 になる）。
 */
export interface CreateUserInput {
    /** メールアドレス。バックエンドで正規化して保存される */
    email?: string;
    /** 表示名（50文字以内）。前後の空白除去とHTMLエスケープを行って保存される */
    displayName?: string;
    /** 認証プロバイダー。列挙値以外を指定すると 400 になる */
    authProvider?: 'google' | 'facebook' | 'twitter' | 'github' | 'email';
    /** プロフィール（500文字以内）。更新APIが無いため設定できるのは新規登録時のみ */
    bio?: string;
}

/**
 * ユーザー情報取得API（`GET /users/:uid`）／登録API（`POST /users`）が返す`data`部。
 *
 * バックエンドは Prisma の行をそのまま返すため、キー名はリクエスト（{@link CreateUserInput}）の
 * キャメルケースではなく DBカラム名（スネークケース）で、対応も1対1ではない。
 *
 * | {@link CreateUserInput}（リクエスト） | `ApiUser`（レスポンス） |
 * |---|---|
 * | （送らない。トークンから取得） | `id` |
 * | `displayName` | `display_name` |
 * | `authProvider` | `provider` |
 * | （無し） | `created_at` / `updated_at` |
 *
 * 登録APIは全項目が任意で、未指定の項目は null として保存されるため、
 * `id`以外はすべて nullable になる。
 */
export interface ApiUser {
    /** ユーザーID。Firebase Authentication の uid がそのまま入る */
    id: string;
    /** 表示名。未設定なら null */
    display_name: string | null;
    /** メールアドレス。未設定なら null */
    email: string | null;
    /** プロフィール。未設定なら null */
    bio: string | null;
    /** 認証プロバイダー（google / facebook など）。未設定なら null */
    provider: string | null;
    /** 作成日時（ISO 8601 文字列） */
    created_at: string;
    /** 更新日時（ISO 8601 文字列） */
    updated_at: string;
}
