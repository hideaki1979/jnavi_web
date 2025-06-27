import { useMediaQuery, useTheme } from "@mui/material";
import { useEffect, useState } from "react";

/**
 * MUIのBreakpointを使用して、画面サイズが小さい端末(スマートフォン)かどうかを判定するフック。
 * useEffectを使用してマウント完了後にisMobileをtrue/falseに設定する。
 * 画面サイズが小さい端末の場合はtrueを、そうでない場合はfalseを返す。
 * @returns {isMobile: boolean, mounted: boolean}
 *   - isMobile: trueの場合は、画面サイズが小さい端末(falseの場合はそうでない)
 *   - mounted: trueの場合は、コンポーネントがマウント完了(falseの場合はそうでない)
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