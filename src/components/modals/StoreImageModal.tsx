/**
 * 店舗画像の拡大表示用モーダルコンポーネント。
 * - 画像のプレビュー・閉じる操作を提供
 */
import { StoreImageDownloadData } from "@/types/Store";
import { Close } from "@mui/icons-material";
import { Box, Dialog, DialogContent, DialogTitle, Divider, IconButton, Typography } from "@mui/material";
import Image from "next/image";

interface StoreImageModalProps {
    open: boolean;
    image: StoreImageDownloadData | null;
    onClose: () => void;
    menuTypeLabels: Record<string, string>;
}

/**
 * 店舗画像の拡大表示用モーダルコンポーネント。
 *
 * - 画像のプレビュー・閉じる操作を提供
 * - 画像のトッピングコール情報を表示
 *
 * @param {{ open: boolean; image: StoreImageDownloadData | null; onClose: () => void; menuTypeLabels: Record<string, string> }} props
 * @returns {JSX.Element}
 */
export default function StoreImageModal({ open, image, onClose, menuTypeLabels }: StoreImageModalProps) {
    if (!image) return null
    return (
        <Dialog
            open={open} onClose={onClose} maxWidth="sm" fullWidth
        >
            <DialogTitle sx={{ p: 4 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Typography variant="h6" fontWeight="bold">
                        【{menuTypeLabels[image.menu_type]}】{image.menu_name}
                    </Typography>
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
            </DialogTitle>
            <DialogContent sx={{ p: 2 }}>
                <Box mb={4} display="flex" justifyContent="center"
                >
                    <Image
                        src={image.image_url}
                        alt={image.menu_name}
                        width={300}
                        height={200}
                        style={{ borderRadius: 8, objectFit: "contain", maxWidth: "100%", height: "auto" }}
                        loading="lazy"
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
