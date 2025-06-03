import { Warning } from "@mui/icons-material";
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Typography } from "@mui/material";

interface StoreCloseConfirmDialogProps {
    open: boolean;
    title: string;
    message: string;
    targetName?: string;
    onClose: () => void;
    onConfirm: () => void;
    isLoading: boolean;
    confirmButtonText?: string;
    cancelButtonText?: string;
    confirmButtonColor?: 'error' | 'primary' | 'secondary' | 'success' | 'info' | 'warning';
}

export function StoreCloseConfirmDialog({
    open,
    title,
    message,
    targetName,
    onClose,
    onConfirm,
    isLoading = false,
    confirmButtonText = "実行",
    cancelButtonText = "キャンセル",
    confirmButtonColor = "primary"
}: StoreCloseConfirmDialogProps) {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            aria-labelledby="store-close-dialog-title"
            slotProps={{
                backdrop: {
                    sx: { backgroundColor: "rgba(0, 0, 0, 0.7)" }
                },
                paper: {
                    sx: { backgroundColor: "#d6d4d4" }
                }
            }}
        >
            <DialogTitle
                id="store-close-dialog-title"
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
                <Warning color="warning" />
                {title}
            </DialogTitle>
            <DialogContent>
                <DialogContentText component="div">
                    <Typography variant="body2" mb={2}>
                        {message}
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                        {targetName}
                    </Typography>
                </DialogContentText>
            </DialogContent>
            <DialogActions
                sx={{ p: 2, gap: 1 }}
            >
                <Button
                    onClick={onClose}
                    disabled={isLoading}
                    variant="contained"
                >
                    {cancelButtonText}
                </Button>
                <Button
                    onClick={onConfirm}
                    disabled={isLoading}
                    color={confirmButtonColor}
                    variant="contained"
                >
                    {isLoading ? "処理中・・・" : confirmButtonText}
                </Button>
            </DialogActions>
        </Dialog>
    )
}