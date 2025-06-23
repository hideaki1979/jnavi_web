import { NextRequest, NextResponse } from "next/server";
import { verifySessionCookie } from "@/lib/server/firebaseAdmin";

export async function POST(request: NextRequest) {
    try {
        const session = request.headers.get('Authorization')?.split('Bearer ')[1] || ''
        if (!session) {
            return NextResponse.json({ isAuth: false }, { status: 401 })
        }
        const decodedClaims = await verifySessionCookie(session)
        if (!decodedClaims) {
            return NextResponse.json({ isAuth: false }, { status: 401 })
        }
        return NextResponse.json({ isAuth: true }, { status: 200 })
    } catch (error) {
        console.error("ユーザー認証エラー：", error)
        return NextResponse.json({ isAuth: false }, { status: 401 })
    }
} 