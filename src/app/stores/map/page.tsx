"use client"

import { getMapAll } from "@/app/api/stores";
import { StoreInfoDrawer } from "@/components/StoreInfoDrawer";
import { MapData, MapStore } from "@/types/Store";
import { Box, CircularProgress, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { AdvancedMarker, APIProvider, Map, Pin } from '@vis.gl/react-google-maps'
import { useEffect, useState } from "react";

const defaultCenter = { lat: 35.681236, lng: 139.767125 } // 東京駅
const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!

export default function MapPage() {
    const { data: mapData, isLoading, error } = useQuery({
        queryKey: ['mapData'],
        queryFn: getMapAll
    })

    const [center, setCenter] = useState(defaultCenter)
    const [selectedStore, setSelectedStore] = useState<MapStore | null>(null)
    const [drawerOpen, setDrawerOpen] = useState<boolean>(false)

    useEffect(() => {
        if (!navigator.geolocation) return
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setCenter({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                })
            },
            (error) => {
                console.error("現在地情報取得エラー：", error)
            }

        )
    }, [])

    const handlerMarkerClick = (store: MapStore) => {
        setSelectedStore(store)
        setDrawerOpen(true)
    }

    // console.log(mapData)

    if (isLoading) return (
        <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="100vh" >
            <CircularProgress color="primary" />
            <p className="mt-4 text-gray-300">Loading...</p>
        </Box>
    )

    if (error) return <div>エラーです。<br />{error.message}</div>

    return (
        <Box
        >
            <Typography variant="h6" className="w-full text-center mb-4 font-bold">店舗マップ（登録店舗は黄色、赤は閉店です。）</Typography>
            <APIProvider apiKey={apiKey}>
                <Box
                    width="80vw"
                    height="70vh"
                >
                    <Map
                        mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_ID}
                        defaultCenter={center}
                        defaultZoom={16}
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
    )
}
