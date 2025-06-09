"use client"

import { useAuthStore } from "@/lib/AuthStore";
import { auth } from "@/lib/firebase";
import { AccountCircle, AddBusiness, Logout, Menu as MenuIcon, PersonAdd, School } from "@mui/icons-material";
import { AppBar, Box, Button, IconButton, Menu, MenuItem, Toolbar, Typography, useMediaQuery, useTheme } from "@mui/material";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

interface HeaderProps {
    title?: string;
}

export function Header({ title = "J-Navi" }: HeaderProps) {
    const router = useRouter()
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('md'))
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

    // Zustandから認証状態を取得
    const { isAuthenticated, isLoading } = useAuthStore()

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget)
    }

    const handleMenuClose = () => {
        setAnchorEl(null)
    }

    const handleNavigation = (path: string) => {
        router.push(path)
        handleMenuClose()
    }

    const handleSignOut = async () => {
        try {
            await signOut(auth)
            router.push(`/auth/login`)
            handleMenuClose()
        } catch (error) {
            console.error(`ログアウト失敗： ${error}`)
        }
    }

    // 未ログイン時のメニュー項目
    const unauthenticatedItems = [
        {
            id: "login",
            label: "ログイン",
            icon: <AccountCircle />,
            path: "/auth/login"
        },
        {
            id: "signup",
            label: "アカウント作成",
            icon: <PersonAdd />,
            path: "/auth/signup"
        },
        {
            id: "simulation",
            label: "シミュレーション",
            icon: <School />,
            path: "/stores/simulation/ticket"
        }
    ]

    // ログイン時のメニュー項目
    const authenticatedItems = [
        {
            id: "simulation",
            label: "シミュレーション",
            icon: <School />,
            path: "/stores/simulation/ticket"
        },
        {
            id: "createStore",
            label: "店舗登録",
            icon: <AddBusiness />,
            path: "/stores/create"
        },
        {
            id: "logout",
            label: "ログアウト",
            icon: <Logout />,
            action: handleSignOut
        }
    ]

    // 現在の認証状態に応じてメニュー項目を選択
    const navigationItems = isAuthenticated ? authenticatedItems : unauthenticatedItems

    // ローディング中の場合は何も表示しない
    if (isLoading) {
        return (
            <AppBar
                position="sticky"
                sx={{
                    backgroundColor: theme.palette.grey[600],
                    boxShadow: theme.shadows[4]
                }}
            >
                <Toolbar sx={{ justifyContent: "space-between" }}>
                    <Typography
                        variant="h6" component="div"
                        sx={{
                            fontWeight: "bold",
                            cursor: "pointer",
                            color: theme.palette.text.primary
                        }}
                        onClick={() => router.push('/stores/map')}
                    >
                        {title}
                    </Typography>
                </Toolbar>

            </AppBar>
        )
    }

    return (
        <AppBar
            position="sticky"
            sx={{
                backgroundColor: theme.palette.grey[600],
                boxShadow: theme.shadows[4]
            }}
        >
            <Toolbar sx={{ justifyContent: "space-between" }}>
                {/* アプリ名 */}
                <Typography
                    variant="h6" component="div"
                    sx={{
                        fontWeight: "bold",
                        cursor: "pointer",
                        color: theme.palette.text.primary
                    }}
                    onClick={() => router.push('/stores/map')}
                >
                    {title}
                </Typography>

                {/* ナビゲーション部分 - マウント後のみ表示 */}
                <>
                    {/* デスクトップ用ナビゲーション */}
                    {!isMobile ? (
                        <Box display="flex" gap={2}>
                            {navigationItems.map((item) => (
                                <Button
                                    key={item.id}
                                    color="inherit"
                                    startIcon={item.icon}
                                    onClick={() => 'action' in item && item.action ? item.action() : handleNavigation(item.path!)}
                                    sx={{
                                        textTransform: "none",
                                        fontWeight: 500,
                                        borderRadius: 2,
                                        px: 2,
                                        "&:hover": {
                                            backgroundColor: "rgba(255, 255, 255, 0.1)"
                                        }
                                    }}
                                >
                                    {item.label}
                                </Button>
                            ))}
                        </Box>
                    ) : (
                        /* モバイル用ハンバーガーメニュー */
                        <>
                            <IconButton
                                color="inherit"
                                aria-label="メニューを開く"
                                onClick={handleMenuOpen}
                            >
                                <MenuIcon />
                            </IconButton>
                            <Menu
                                anchorEl={anchorEl}
                                open={Boolean(anchorEl)}
                                onClose={handleMenuClose}
                                anchorOrigin={{
                                    vertical: "bottom",
                                    horizontal: "right"
                                }}
                                transformOrigin={{
                                    vertical: "top",
                                    horizontal: "right"
                                }}
                            >
                                {navigationItems.map((item) => (
                                    <MenuItem
                                        key={item.id}
                                        onClick={() => 'action' in item && item.action ? item.action() : handleNavigation(item.path!)}
                                        sx={{ gap: 2 }}
                                    >
                                        {item.icon}
                                        {item.label}
                                    </MenuItem>
                                ))}
                            </Menu>
                        </>
                    )}
                </>
            </Toolbar>
        </AppBar>
    )
}