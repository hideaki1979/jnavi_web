/**
 * 店舗画像の拡大表示用モーダルコンポーネント。
 * - 画像のプレビュー・閉じる操作を提供
 */
import { UI_CONSTANTS } from "@/constants/ui";
import { StoreImageDownloadData } from "@/types/Store";
import { MenuTypeLabels } from "@/types/ui";
import { Close, Delete, EditNote } from "@mui/icons-material";
import { Box, Dialog, DialogContent, DialogTitle, Divider, IconButton, Tooltip, Typography } from "@mui/material";
import Image from "next/image";

interface StoreImageModalProps {
    open: boolean;
    image: StoreImageDownloadData | null;
    onClose: () => void;
    menuTypeLabels: MenuTypeLabels;
    currentUserId?: string;
    onUpdate?: (imageId: string | number) => void;
    onDelete?: (imageId: string | number) => void;
}

/**
 * 店舗画像の拡大表示用モーダルコンポーネント。
 *
 * - 画像のプレビュー・閉じる操作を提供
 * - 画像のトッピングコール情報を表示
 *
 * @param {{ open: boolean; image: StoreImageDownloadData | null; onClose: () => void; menuTypeLabels: MenuTypeLabels }} props
 * @returns {JSX.Element}
 */
export default function StoreImageModal({
    open, image, onClose, menuTypeLabels, currentUserId, onUpdate, onDelete
}: StoreImageModalProps) {
    if (!image) return null

    // 画像の所有者かどうかを判定
    const isOwner = currentUserId && image.user_id === currentUserId

    const handleUpdate = () => {
        onUpdate?.(image.id)
    }

    const handleDelete = () => {
        onDelete?.(image.id)
    }

    return (
        <Dialog
            open={open} onClose={onClose} maxWidth="xs" fullWidth
        >
            <DialogTitle sx={{ p: 4 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                    {/* 左側：編集・削除アイコン（所有者のみ表示） */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, marginBottom: 2 }}>
                        {isOwner && (
                            <>
                                <Tooltip
                                    title="画像編集画面"
                                    slotProps={{
                                        tooltip: {
                                            sx: {
                                                fontSize: '0.85rem', // 12px相当
                                                fontWeight: 500
                                            }
                                        }
                                    }}
                                >
                                    <IconButton aria-label="更新" onClick={handleUpdate} color='primary'>
                                        <EditNote />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip
                                    title="画像削除"
                                    slotProps={{
                                        tooltip: {
                                            sx: {
                                                fontSize: '0.85rem', // 12px相当
                                                fontWeight: 500
                                            }
                                        }
                                    }}
                                >
                                    <IconButton aria-label="画像削除" onClick={handleDelete} color='error'>
                                        <Delete />
                                    </IconButton>
                                </Tooltip>
                            </>
                        )}
                    </Box>
                    {/* 右側：閉じるボタン */}
                    <IconButton
                        aria-label="close"
                        onClick={onClose}
                        sx={{
                            color: (theme) => theme.palette.grey[700]
                        }}
                    >
                        <Close />
                    </IconButton>
                </Box>
                <Typography variant="h6" fontWeight="bold" component="div">
                    【{menuTypeLabels[image.menu_type]}】{image.menu_name}
                </Typography>
            </DialogTitle>
            <DialogContent sx={{ p: 2 }}>
                <Box mb={4} display="flex" justifyContent="center" alignItems="center"
                    sx={{ position: "relative", width: "100%", height: UI_CONSTANTS.IMAGE_MODAL.CONTAINER_HEIGHT }}
                >
                    <Image
                        src={image.image_url}
                        alt={image.menu_name}
                        fill
                        style={{
                            borderRadius: 8,
                            objectFit: "contain",
                        }}
                        loading="lazy"
                        sizes='(max-width: 768px) 100vw, 50vw'
                    />
                </Box>
                <Divider />
                <Box sx={{ p: 4 }}>
                    <Typography variant="subtitle1" fontWeight="bold" mb={2}>
                        トッピングコール情報
                    </Typography>
                    {image.topping_calls && image.topping_calls.length > 0 ? (
                        image.topping_calls.map((topping) => (
                            <Box key={topping.topping_id} display="flex" mb={2}>
                                <Typography variant="body2" fontWeight="bold">
                                    {topping.topping_name}：
                                </Typography>
                                <Typography variant="body2">
                                    {topping.call_option_name}
                                </Typography>
                            </Box>
                        ))
                    ) : (
                        <Typography variant="body1" color="text.secondary">
                            トッピング情報無し
                        </Typography>
                    )}
                </Box>
            </DialogContent>
        </Dialog>
    )
}
