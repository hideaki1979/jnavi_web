"use client"

import LoadingErrorContainer from "@/components/feedback/LoadingErrorContainer";
import { MapData, MapStore } from "@/types/Store";
import { Box, Typography } from "@mui/material";
import { AdvancedMarker, APIProvider, Map as GoogleMap, Pin } from '@vis.gl/react-google-maps'
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const defaultCenter = { lat: 35.681236, lng: 139.767125 } // 東京駅
const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!

const StoreInfoDrawer = dynamic(() =>
    import('@/components/Store/StoreInfoDrawer').then(mod => mod.StoreInfoDrawer), {
    loading: () => null,
    ssr: false
})

interface StoreMapProps {
    mapData: MapData[]
}

/**
 * 店舗情報を地図上に表示し、現在地取得や店舗詳細の閲覧ができるマップ画面コンポーネントです。
 *
 * 指定された店舗データをGoogleマップ上にマーカーとして表示し、ユーザーの現在地を取得して地図の中心に設定します。マーカーをクリックすると店舗詳細情報をドロワーで表示できます。閉店店舗は赤色、営業中店舗は黄色のマーカーで区別されます。
 *
 * @param mapData - 地図上に表示する店舗情報の配列
 */
export default function StoreMap({ mapData }: StoreMapProps) {
    const [center, setCenter] = useState(defaultCenter)
    const [selectedStore, setSelectedStore] = useState<MapStore | null>(null)
    const [drawerOpen, setDrawerOpen] = useState<boolean>(false)
    const [isLocationLoading, setIsLocationLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    // 位置情報取得の現在地設定
    useEffect(() => {
        if (!isMounted) return

        setIsLocationLoading(true)
        if (!navigator.geolocation) {
            setIsLocationLoading(false)
            setErrorMessage("位置情報取得の権限がありません。")
            return
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setCenter({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                })
                setIsLocationLoading(false)
            },
            (positionError) => {
                console.error("現在地情報取得エラー：", positionError)
                setIsLocationLoading(false)
                setErrorMessage("現在地情報取得に失敗しました")
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 600000  // 10分
            }
        )
    }, [isMounted])

    /**
     * マーカークリックハンドラ
     * @param store マーカーに紐づく店舗情報
     */
    const handlerMarkerClick = (store: MapStore) => {
        setSelectedStore(store)
        setDrawerOpen(true)
    }

    if (isLocationLoading || errorMessage || !isMounted) {
        return <LoadingErrorContainer loading={isLocationLoading} error={errorMessage} />
    }

    return (
        <>
            <Box sx={{ paddingTop: 2 }}>
                <Typography variant="h6" className="w-full text-center mb-4 font-bold">
                    店舗マップ（登録店舗は黄色、赤は閉店です。）
                </Typography>
                <APIProvider apiKey={apiKey}>
                    <Box
                        width="100vw"
                        height="70vh"
                    >
                        <GoogleMap
                            mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_ID}
                            center={center}
                            defaultZoom={14}
                            style={{ width: "100%", height: "100%" }}
                            gestureHandling={"greedy"}
                            disableDefaultUI={true}
                            onCameraChanged={(ev) => setCenter(ev.detail.center)}
                        >
                            {mapData?.map((store: MapData) => (
                                <AdvancedMarker
                                    key={store.id}
                                    position={{ lat: Number(store.latitude), lng: Number(store.longitude) }}
                                    onClick={() => {
                                        handlerMarkerClick(store.store)
                                    }}
                                    title={store.store.branch_name
                                        ? `${store.store.store_name} ${store.store.branch_name}`
                                        : store.store.store_name
                                    }
                                >
                                    <Pin
                                        background={store.store.is_close ? "#FF0000" : "#FFFF00"}
                                        borderColor={store.store.is_close ? "#B71C1C" : "#BDB800"}
                                        glyphColor={store.store.is_close ? "#FFFFFF" : "#333333"}
                                    />
                                </AdvancedMarker>
                            ))}
                        </GoogleMap>
                        <StoreInfoDrawer
                            open={drawerOpen}
                            store={selectedStore}
                            onClose={() => setDrawerOpen(false)}
                        />
                    </Box>
                </APIProvider>
            </Box>
        </>
    )
}
