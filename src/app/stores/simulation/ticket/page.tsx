"use client"

import { getStoreAll } from "@/app/api/stores"
import LoadingErrorContainer from "@/components/feedback/LoadingErrorContainer"
import { ShopAutocomplete } from "@/components/simulation/ShopAutoComplete"
import { TicketCardList } from "@/components/simulation/TicketCardList"
import { SimulationSelectStoresData, Ticket } from "@/types/Store"
import { Box, Typography } from "@mui/material"
import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import React, { useState } from "react"

const tickets: Ticket[] = [
    { id: 1, menu_name: "小ラーメン", price: 600 },
    { id: 2, menu_name: "小豚入り", price: 700 },
    { id: 3, menu_name: "小W豚入り", price: 800 },
    { id: 4, menu_name: "大ラーメン", price: 700 },
    { id: 5, menu_name: "大豚入り", price: 800 },
    { id: 6, menu_name: "大W豚入り", price: 900 }
]

/**
 * TicketMachinePage コンポーネント。
 *
 * - 店舗の選択と食券のシミュレーションを行うページを表示します。
 * - 店舗情報を取得し、プルダウンで選択可能。
 * - 選択した店舗の情報で次のシミュレーション画面に遷移。
 * - エラーやロード状態を適切にハンドリングし、ユーザーにメッセージを表示。
 *
 * @returns JSX.Element
 */

export default function TicketMachinePage() {
    const router = useRouter()
    const [selectedShop, setSelectedShop] = useState<SimulationSelectStoresData | null>(null)
    const [errorMsg, setErrorMsg] = useState<string>("")

    const { data: stores, isLoading, isError, error } = useQuery<SimulationSelectStoresData[]>({
        queryKey: ["get_stores"],
        queryFn: getStoreAll
    })

    const handleShopChange = (store: SimulationSelectStoresData | null) => {
        setSelectedShop(store)
        if (errorMsg) {
            setErrorMsg('')
        }
    }

    /**
     * 店舗選択と食券選択後、コールシミュレーション画面に遷移するハンドラ。
     *
     * - 選択された店舗IDをパラメータに設定し、/stores/simulation/precallに遷移。
     * - 店舗が選択されていない場合はエラーメッセージを表示。
     */
    const handleSelectTicket = () => {
        if (!selectedShop) {
            setErrorMsg("店舗を選択してください")
            return
        }
        router.push(`/stores/simulation/precall?id=${selectedShop.id}`)
    }

    if (isLoading || isError) {
        return <LoadingErrorContainer loading={isLoading} error={isError ? (error as Error).message : null} />
    }

    return (
        <Box px={4} py={6} bgcolor="#cac8c8" color="#000">
            <Typography variant="h6" align="center" fontWeight="bold" mb={2}>
                コールシミュレーション
            </Typography>
            {errorMsg && (
                <Typography variant="subtitle1" color="#ff0000">
                    {errorMsg}
                </Typography>
            )}
            <ShopAutocomplete
                stores={stores || []}
                selectedStore={selectedShop}
                onChange={handleShopChange}
            />
            <Box mt={4}>
                <TicketCardList tickets={tickets} onSelect={handleSelectTicket} />
            </Box>
            <Box mt={4} textAlign="center">
                <Typography>あなたは券売機の前にいます。</Typography>
                <Typography>食べたいメニューを選んでください。</Typography>
            </Box>
        </Box>
    )

}