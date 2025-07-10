"use client"

import { MapData } from '@/types/Store'
import { CircularProgress } from '@mui/material'
import dynamic from 'next/dynamic'

const StoreMap = dynamic(() => import('@/components/Store/StoreMap'), {
    loading: () => <CircularProgress />,
    ssr: false
})

interface StoreMapClientProps {
    mapData: MapData[];
}

export default function StoreMapClient({ mapData }: StoreMapClientProps) {
    return <StoreMap mapData={mapData} />
}