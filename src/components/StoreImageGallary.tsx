import { MapStore, StoreImageDownloadData } from "@/types/Store"

const MENU_TYPE_LABELS: Record<string, string> = {
    "1": "通常",
    "2": "限定"
}

interface StoreImageGallaryProps {
    store: MapStore | null;
    imageData: StoreImageDownloadData[];
    modalOpen: boolean;
    setMadalOpen: (open: boolean) => void;
    selectedImage: StoreImageDownloadData | null
    setSelectedImage: (image: StoreImageDownloadData | null) => void;
}