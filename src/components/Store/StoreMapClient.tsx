"use client"

import { MapData } from '@/types/Store'
import dynamic from 'next/dynamic'

const StoreMap = dynamic(() => import('@/components/Store/StoreMap'), {
    ssr: false
})

interface StoreMapClientProps {
    mapData: MapData[];
}

export default function StoreMapClient({ mapData }: StoreMapClientProps) {
    return <StoreMap mapData={mapData} />
}