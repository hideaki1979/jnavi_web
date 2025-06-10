"use client"

import { CallResultScreen } from "@/components/simulation/CallResultScreen"
import { useSearchParams } from "next/navigation"

/**
 * 事前コールシミュレーションの結果を表示するページ。
 * - `callText` として、事前コールの内容を指定する。
 * - `id` として、店舗IDを指定する。
 * - NextPageでは `/stores/simulation/postcall` として遷移する。
 */
export default function PrecallResultPage() {
    const searchParams = useSearchParams()
    const callText = searchParams.get('callText') ?? ""
    const id = searchParams.get('id') ?? ""

    return (
        <CallResultScreen
            callText={callText}
            nextHref="/stores/simulation/postcall"
            nextQuery={{ id }}
        />
    )
}
