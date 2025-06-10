"use client"

import { CallResultScreen } from "@/components/simulation/CallResultScreen"
import { useSearchParams } from "next/navigation"

/**
 * コールの結果を表示するページ。
 * - urlパラメーター `callText` にコールの内容を指定する
 * - 次のページは `/stores/simulation/afterfinish` である
 */
export default function PostcallResultPage() {
    const searchParams = useSearchParams()
    const callText = searchParams.get('callText') ?? ""

    return (
        <CallResultScreen
            callText={callText}
            nextHref="/stores/simulation/afterfinish"
        />
    )
}
