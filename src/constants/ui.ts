import { MenuTypeLabels } from "@/types/ui"

export const UI = {
    HEADER_HEIGHT: 64,
} as const

export const UI_CONSTANTS = {
    IMAGE_MODAL: {
        CONTAINER_HEIGHT: 240
    }
} as const

export const MENU_TYPE_LABELS: MenuTypeLabels = {
    "1": "通常",
    "2": "限定"
} as const
