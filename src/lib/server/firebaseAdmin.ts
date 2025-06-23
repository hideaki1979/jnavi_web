'use server'

import * as admin from 'firebase-admin'

// Firebase Admin SDKの初期化
if (!admin.apps.length) {
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
        throw new Error('Firebase Admin SDKの初期化に必要な環境変数が設定されていません。');
    }
    const serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Vercelの環境変数では改行が `\\n` となるため、`\n` に置換する
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    }
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    })
}

/**
 * サーバーサイドでユーザーの認証状態を確認する
 * @returns {Promise<admin.auth.DecodedIdToken | null>} 認証されたユーザーの情報、またはnull
 */
export async function verifySessionCookie(sessionCookie: string): Promise<admin.auth.DecodedIdToken | null> {
    if (!sessionCookie) {
        return null
    }

    try {
        // セッションクッキーを検証
        const decodedIdToken = await admin.auth().verifySessionCookie(sessionCookie, true)
        return decodedIdToken
    } catch (error) {
        console.error('認証セッションクッキーエラー:', error);
        return null;
    }
}