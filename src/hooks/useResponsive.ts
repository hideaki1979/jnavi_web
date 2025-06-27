import { useMediaQuery, useTheme } from "@mui/material";
import { useEffect, useState } from "react";

/**
 * ハイドレーションエラーを回避しつつ、レスポンシブなブレークポイントを提供するカスタムフック
 *
 * @returns {{
 *  isMobile: boolean,
 *  isTablet: boolean,
 *  isDesktop: boolean,
 *  mounted: boolean
 * }}
 *  - isMobile: モバイルデバイス（md未満）かどうか
 *  - isTablet: タブレットデバイス（md以上lg未満）かどうか
 *  - isDesktop: デスクトップデバイス（lg以上）かどうか
 *  - mounted: コンポーネントがマウントされたかどうか
 */
export function useResponsive() {
    const [mounted, setMounted] = useState(false)
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('md'))
    const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'))
    const isDesktop = useMediaQuery(theme.breakpoints.up('lg'))

    useEffect(() => setMounted(true), [])

    return {
        isMobile: mounted ? isMobile : false,
        isTablet: mounted ? isTablet : false,
        isDesktop: mounted ? isDesktop : false,
        mounted
    }
}