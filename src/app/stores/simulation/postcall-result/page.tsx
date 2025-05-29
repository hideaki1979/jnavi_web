"use client"

import { CallResutScreen } from "@/components/simulation/CallResultScreen"
import { useSearchParams } from "next/navigation"

export default function PostcallResultPage() {
    const searchParams = useSearchParams()
    const callText = searchParams.get('callText') ?? ""

    return (
        <CallResutScreen
            callText={callText}
            nextHref="/stores/simulation/afterfinish"
        />
    )
}
