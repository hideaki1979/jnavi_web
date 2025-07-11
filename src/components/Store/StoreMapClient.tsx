"use client"

import { MapData } from '@/types/Store'
import dynamic from 'next/dynamic'
import LoadingErrorContainer from '../feedback/LoadingErrorContainer';

const StoreMap = dynamic(() => import('@/components/Store/StoreMap'), {
    loading: () => <LoadingErrorContainer loading={true} />,
    ssr: false
})

interface StoreMapClientProps {
    mapData: MapData[];
}

export default function StoreMapClient({ mapData }: StoreMapClientProps) {
    return <StoreMap mapData={mapData} />
}