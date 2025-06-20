"use client"

import LoadingErrorContainer from "@/components/feedback/LoadingErrorContainer";
import { StoreInfoDrawer } from "@/components/StoreInfoDrawer";
import { useStoresForMap } from "@/hooks/api/useStores";
import { MapData, MapStore } from "@/types/Store";
import { Box, Typography } from "@mui/material";
import { AdvancedMarker, APIProvider, Map, Pin } from '@vis.gl/react-google-maps'
import { useEffect, useState } from "react";

const defaultCenter = { lat: 35.681236, lng: 139.767125 } // 東京駅
const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!

/**
 * 店舗マップ画面コンポーネント
 * - 店舗情報を表示するマップを表示
 * - 現在地を取得して中心に設定
 * - マップ上に店舗情報をマーカーとして表示
 * - マーカーをクリックすると店舗情報を表示するドロワーコンポーネントを表示
 * - ドロワーコンポーネントは閉じるボタンをクリックすることで消える
 */
export default function MapPage() {
    const { data: mapData, isLoading, isError, error } = useStoresForMap()

    const [center, setCenter] = useState(defaultCenter)
    const [selectedStore, setSelectedStore] = useState<MapStore | null>(null)
    const [drawerOpen, setDrawerOpen] = useState<boolean>(false)
    const [isLocationLoading, setIsLocationLoading] = useState(true)

    // 位置情報取得の現在地設定
    useEffect(() => {
        if (!navigator.geolocation) {
            setIsLocationLoading(false)
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
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 600000  // 10分
            }
        )
    }, [])

    /**
     * マーカークリックハンドラ
     * @param store マーカーに紐づく店舗情報
     */
    const handlerMarkerClick = (store: MapStore) => {
        setSelectedStore(store)
        setDrawerOpen(true)
    }

    // エラーメッセージ設定
    const getErrorMessage = (): string | null => {
        if (!error) {
            return null
        } else {
            return `マップデータ取得失敗： ${error.message}`
        }
    }

    if (isLoading || isError || isLocationLoading) {
        return <LoadingErrorContainer loading={isLoading || isLocationLoading} error={getErrorMessage()} />
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
                        <Map
                            mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_ID}
                            defaultCenter={center}
                            defaultZoom={14}
                            style={{ width: "100%", height: "100%" }}
                            gestureHandling={"greedy"}
                            disableDefaultUI={true}
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
                        </Map>
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
