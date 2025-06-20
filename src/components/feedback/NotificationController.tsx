"use client"

import { useNotification } from "@/lib/notification"
import { useEffect } from "react"
import toast from "react-hot-toast"

/**
 * Zustandストアと連携して、react-hot-toastによる通知を管理するコンポーネント。
 * アプリケーションのルートレベルに配置して使用する。
 */
export const NotificationController = () => {
    const { isOpen, message, type, hideNotification } = useNotification()

    useEffect(() => {
        if (isOpen) {
            switch (type) {
                case "success":
                    toast.success(message)
                    break;
                case "error":
                    toast.error(message)
                    break;
                default:
                    toast(message)
                    break;
            }
            // 通知を表示したらストアの状態をリセット
            hideNotification()
        }
    }, [isOpen, message, type, hideNotification])

    return null //このコンポーネントはUIを持たない
}