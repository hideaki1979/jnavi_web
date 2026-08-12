/**
 * Firebase Admin SDK の初期化と、セッションクッキー検証を提供するサーバー専用モジュール。
 *
 * ここでは `'use server'` ではなく `import 'server-only'` を使う（#90）。
 *
 * `'use server'` はファイル内の全 export を Server Action の候補にする。ただし実際に
 * 公開POSTエンドポイントとして登録されるのはクライアント側から参照されているものだけで、
 * このモジュールの利用箇所は `src/app/api/auth/verify/route.ts` と
 * `src/app/api/auth/session/route.ts` のサーバー側のみのため、
 * `'use server'` を付けた状態でも `verifySessionCookie` は登録されていなかった
 * （`.next/server/server-reference-manifest.json` で確認済み）。
 *
 * 問題は、その安全性が「クライアントから import されていない」という
 * import グラフの偶然に依存している点にある。誰かがクライアントコンポーネントから
 * このモジュールを import した瞬間、`verifySessionCookie` は
 * 「セッションクッキー文字列を渡すと `DecodedIdToken` が返る」オラクルとして
 * 実IDつきで登録され、公開POSTエンドポイントになる（実測で再現済み）。
 *
 * `server-only` にしておけば、その import は
 * 「'server-only' cannot be imported from a Client Component module」として
 * ビルド時に落ちる。偶然の安全を、強制される安全に変えるための指定。
 */
import 'server-only'

import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import type { DecodedIdToken } from 'firebase-admin/auth'

// Firebase Admin SDKの初期化
if (!getApps().length) {
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
        throw new Error('Firebase Admin SDKの初期化に必要な環境変数が設定されていません。');
    }
    const serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Vercelの環境変数では改行が `\\n` となるため、`\n` に置換する
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    }
    initializeApp({
        credential: cert(serviceAccount)
    })
}

/**
 * サーバーサイドでユーザーの認証状態を確認する
 * @returns {Promise<DecodedIdToken | null>} 認証されたユーザーの情報、またはnull
 */
export async function verifySessionCookie(sessionCookie: string): Promise<DecodedIdToken | null> {
    if (!sessionCookie) {
        return null
    }

    try {
        // セッションクッキーを検証
        const decodedIdToken = await getAuth().verifySessionCookie(sessionCookie, true)
        return decodedIdToken
    } catch (error) {
        console.error('認証セッションクッキーエラー:', error);
        return null;
    }
}