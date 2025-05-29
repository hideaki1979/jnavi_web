"use client"

import { getStoreAll } from "@/app/api/stores"
import LoadingErrorContainer from "@/components/feedback/LoadingErrorContainer"
import { ShopDropDown } from "@/components/simulation/ShopDropdown"
import { TicketCardList } from "@/components/simulation/TicketCardList"
import { SimulationSelectStoresData, Ticket } from "@/types/Store"
import { Box, SelectChangeEvent, Typography } from "@mui/material"
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

export default function TicketMachinePage() {
    const router = useRouter()
    const [selectedShop, setSelectedShop] = useState<string>("")
    const [errorMsg, setErrorMsg] = useState<string>("")

    const { data: stores, isLoading, isError, error } = useQuery<SimulationSelectStoresData[]>({
        queryKey: ["get_stores"],
        queryFn: getStoreAll
    })

    const handleShopChange = (event: SelectChangeEvent<string>) => {
        setSelectedShop(event.target.value)
    }

    const handleSelectTicket = () => {
        if (!selectedShop) {
            setErrorMsg("店舗を選択してください")
            return
        }
        router.push(`/stores/simulation/precall?id=${selectedShop}`)
    }

    if (isLoading || isError) {
        return <LoadingErrorContainer loading={isLoading} error={isError ? (error as Error).message : null} />
    }

    return (
        <Box maxWidth={720} mx="auto" p={4} bgcolor="#cac8c8" color="#000">
            <Typography variant="h6" align="center" fontWeight="bold" mb={4}>
                コールシミュレーション
            </Typography>
            {errorMsg && (
                <Typography variant="subtitle1" color="#ff0000">
                    {errorMsg}
                </Typography>
            )}
            <ShopDropDown
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