"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";

/**
 * React QueryのQueryClientProviderをラップするコンポーネント。
 *
 * QueryClientのインスタンスを生成し、QueryClientProviderを返します。
 *
 * @param {{ children: ReactNode }} props
 * @param {ReactNode} props.children
 * @returns {JSX.Element}
 */
export default function QueryClientProviders({ children }:
    { children: ReactNode }) {
    const [queryClient] = useState(() => new QueryClient())

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    )
}