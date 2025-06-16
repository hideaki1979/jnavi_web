"use client"

import { useResponsive } from "@/hooks/useResponsive";
import { useAuthStore } from "@/lib/AuthStore";
import { auth } from "@/lib/firebase";
import { AccountCircle, AddBusiness, Logout, Menu as MenuIcon, PersonAdd, School } from "@mui/icons-material";
import { AppBar, Box, Button, IconButton, Menu, MenuItem, Toolbar, Typography, useTheme } from "@mui/material";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

interface HeaderProps {
    title?: string;
}

/**
 * アプリ全体のヘッダーコンポーネント。
 *
 * - ナビゲーション、ユーザー操作、サインアウト等を提供
 * - 画面サイズに応じてデスクトップ用ナビゲーションとモバイル用ハンバーガーメニューを切り替える
 * - Zustandを使用して認証状態を取得し、認証状態に応じてメニュー項目を選択
 * - ローディング中の場合は何も表示しない
 */
export function Header({ title = "J-Navi" }: HeaderProps) {
    const router = useRouter()
    const theme = useTheme()
    const { isMobile } = useResponsive()
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

    // Zustandから認証状態を取得
    const { isAuthenticated, isLoading } = useAuthStore()

    /**
     * ヘッダーメニューを開くハンドラ
     *
     * @param {React.MouseEvent<HTMLElement>} event - クリックイベント
     */
    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget)
    }

    /**
     * メニューを閉じるハンドラ
     *
     * state変数`anchorEl`を`null`に設定することで、メニューを閉じる
     */
    const handleMenuClose = () => {
        setAnchorEl(null)
    }

    /**
     * ナビゲーションハンドラ
     *
     * 指定されたパスにルーターをプッシュし、メニューを閉じます。
     *
     * @param {string} path - ナビゲーションするパス
     */

    const handleNavigation = (path: string) => {
        router.push(path)
        handleMenuClose()
    }

    /**
     * サインアウトハンドラ
     *
     * Firebase Authenticationのサインアウトを実行し、結果に応じて
     * - 成功時： `/auth/login` にルーターをプッシュし、メニューを閉じる
     * - 失敗時： エラーメッセージをコンソールに表示
     */
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
                                    onClick={() => 'action' in item && item.action ? item.action() : handleNavigation?.(item.path!)}
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
                                        onClick={() => 'action' in item && item.action ? item.action() : handleNavigation?.(item.path!)}
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