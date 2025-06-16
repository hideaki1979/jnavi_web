import { useMediaQuery, useTheme } from "@mui/material";
import { useEffect, useState } from "react";

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