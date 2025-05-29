"use client"

import { CallResutScreen } from "@/components/simulation/CallResultScreen"
import { useSearchParams } from "next/navigation"

export default function PrecallResultPage() {
    const searchParams = useSearchParams()
    const callText = searchParams.get('callText') ?? ""
    const id = searchParams.get('id') ?? ""

    return (
        <CallResutScreen
            callText={callText}
            nextHref="/stores/simulation/postcall"
            nextQuery={{ id }}
        />
    )
}
