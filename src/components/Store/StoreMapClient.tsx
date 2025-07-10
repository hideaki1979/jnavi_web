"use client"

import { MapData } from '@/types/Store'
import { Box, CircularProgress } from '@mui/material';
import dynamic from 'next/dynamic'

const StoreMap = dynamic(() => import('@/components/Store/StoreMap'), {
    loading: () => (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress size="3rem" />
        </Box>
    ),
    ssr: false
})

interface StoreMapClientProps {
    mapData: MapData[];
}

export default function StoreMapClient({ mapData }: StoreMapClientProps) {
    return <StoreMap mapData={mapData} />
}