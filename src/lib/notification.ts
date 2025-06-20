import { create } from "zustand";

type NotificationType = "success" | "error"

interface NotificationState {
    message: string;
    type: NotificationType;
    isOpen: boolean;
    showNotification: (message: string, type?: NotificationType) => void;
    hideNotification: () => void;
}

export const useNotification = create<NotificationState>((set) => ({
    message: "",
    type: "success",
    isOpen: false,
    showNotification: (message, type = "success") =>
        set({ message, type, isOpen: true }),
    hideNotification: () => set({ isOpen: false })
}))