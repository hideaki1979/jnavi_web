import { useMediaQuery, useTheme } from "@mui/material";
import { useEffect, useState } from "react";

/**
 * MUIのBreakpointを利用して、現在の画面がモバイルサイズ（`sm`ブレークポイント以下）かどうかを判定するカスタムフック。
 *
 * サーバーサイドレンダリング(SSR)との水和(hydration)のミスマッチを避けるため、
 * コンポーネントがマウントされた後(`mounted: true`)にのみ`isMobile`が有効な値になります。
 *
 * @returns {{isMobile: boolean, mounted: boolean}} レスポンシブ状態を含むオブジェクト。
 * - `isMobile`: モバイルサイズの場合 `true`。
 * - `mounted`: コンポーネントがクライアントでマウントされた後 `true`。
 */
export function useResponsive() {
    const [mounted, setMounted] = useState(false)
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

    useEffect(() => setMounted(true), [])

    return {
        isMobile: mounted ? isMobile : false,
        mounted
    }
}