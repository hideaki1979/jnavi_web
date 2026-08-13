/**
 * バックエンドAPI（nodedeploytest）の共通レスポンス形状の型定義。
 *
 * 成功時は必ず `{ success: true, message: string, data: T }` の3キーを返す。
 * ただしこれは express のミドルウェアによる機構ではなく、各コントローラが
 * 手書きのリテラルで揃えている「規約」である
 * （`res.json` をラップ・上書きする実装はバックエンドに存在しない）。
 * JSONを返すハンドラ17箇所すべてでこの3キーが揃っていることを確認済み。
 *
 * 確認時に判明した注意点：
 * - 第1キーは boolean の `success` であり、文字列の `status` ではない。
 *   `status: string` を宣言している既存型は実装と一致していない。
 * - 成功時のHTTPステータスは 200 と 201 が混在する（更新系でも 201 を返す
 *   エンドポイントがある）。axios は 2xx をすべて成功として解決するため、
 *   呼び出し側でステータスを見分ける必要はない。
 * - `GET /` と `GET /health` は `res.send(文字列)` で text を返すため対象外
 *   （フロントからは呼んでいない）。
 * - エンベロープはあくまで「殻」であり、`data` の中身はエンドポイントごとに別物。
 *   共通化するのは殻だけとし、`data` の型は各ドメイン型（`MapData[]` など）を
 *   呼び出し側で当てはめる。
 *
 * このファイルはインフラ層の型として独立させ、ドメイン型を import しない。
 */

/**
 * `data` を参照せず `message` だけを使う呼び出し向けのエンベロープ。
 *
 * 実レスポンスには `data` キーも必ず存在するが、この型ではその形を確定させない。
 * `data` を読もうとするとコンパイルエラーになるため、
 * 「中身を使うなら形を確認して型を定義する」ことを強制できる
 * （`any` / `unknown` で受けて素通りさせないための型）。
 *
 * 主な用途は書き込み系（登録・更新・削除）で、成功メッセージだけを
 * トースト表示に使うケース。
 * `api.patch<ApiMessageEnvelope>(...)` として `res.data.message` を取り出す
 * （実例は app/api/stores.ts の storeClose）。
 *
 * `data` の中身がバックエンドの内部表現に近い場合（Prismaの行をそのまま返す等）、
 * 使わない本体をフロントの型として固定しないためにも有効。
 */
export interface ApiMessageEnvelope {
    /** 成功時は必ず true。エラー時のボディはこの型では表現しない */
    success: true;
    /** 処理結果メッセージ（日本語の固定文字列）。全エンドポイントで必ず返る */
    message: string;
}

/**
 * APIの成功レスポンスを表す共通エンベロープ。
 *
 * `api.get<ApiEnvelope<MapData[]>>('/maps')` のように使い、
 * `res.data.data` で本体を取り出す。
 * 型引数を渡さない場合 axios の戻り値は `any` になり、
 * `res.data.data` の型チェックが一切効かなくなるため必ず指定する。
 *
 * @typeParam T エンドポイントごとの本体データの型
 */
export interface ApiEnvelope<T> extends ApiMessageEnvelope {
    /** エンドポイントごとの本体データ。キーは常に存在し、省略されることはない */
    data: T;
}

/*
 * ------------------------------------------------------------------
 * エラーレスポンスについて（このファイルでは型を定義しない）
 * ------------------------------------------------------------------
 * エラー時のボディは成功エンベロープとは別形で、しかも2種類が併存している。
 *
 * 1. errorMiddleware / handleValidationErrors 由来
 *      { success: false; error: string; details?: ExpressValidationError[] }
 *    - 400（バリデーション）は error が固定文言で、details に項目別の詳細が入る
 *    - 401（AppError由来） / 403 / 404 / 500 は success と error の2キーのみ
 *    - 成功時は message、失敗時は error とキー名が非対称である点に注意
 *
 * 2. authMiddleware 由来（401 のみ）
 *      { status: "Unauthorized" | "TokenExpired" | "InvalidToken"; message: string }
 *    - success も error も持たない。同じ 401 でも経路によって形が違う
 *
 * これらは既に ApiErrorResponse（@/types/validation）が全キーを optional として
 * 網羅しており、解釈地点も ApiClient.toActionError の1箇所だけに閉じている。
 * ここで再定義すると二重管理になり乖離するため、エラー型はこのファイルに置かない。
 */
