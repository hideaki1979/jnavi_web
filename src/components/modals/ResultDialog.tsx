import { ResultDialogType } from "@/types/Store";
import { CheckCircle, Error, Warning } from "@mui/icons-material";
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Typography } from "@mui/material";


interface ResultDialogProps {
    open: boolean;
    type: ResultDialogType;
    title: string;
    message: string;
    targetName?: string;
    onConfirm: () => void;
    confirmButtonText?: string;
}

const DIALOG_CONFIG = {
    success: {
        icon: CheckCircle,
        color: 'success' as const,
        backgroundColor: "#e8f5e8"
    },
    error: {
        icon: Error,
        color: 'error' as const,
        backgroundColor: "#ffeaea"
    },
    warning: {
        icon: Warning,
        color: 'warning' as const,
        backgroundColor: "#fff4e6"
    }
}

export function ResultDialog({
    open,
    type,
    title,
    message,
    targetName,
    onConfirm,
    confirmButtonText = "OK"
}: ResultDialogProps) {
    const config = DIALOG_CONFIG[type]
    const IconComponent = config.icon

    return (
        <Dialog
            open={open}
            onClose={onConfirm}
            maxWidth="sm"
            fullWidth
            aria-labelledby="store-close-success-dialog-title"
            slotProps={{
                backdrop: {
                    sx: { backgroundColor: "rgba(0, 0, 0, 0.7)" }
                },
                paper: {
                    sx: { backgroundColor: config.backgroundColor }
                }
            }}
        >
            <DialogTitle
                id="store-close-success-dialog-title"
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
                <IconComponent color={config.color} />
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
                    onClick={onConfirm}
                    variant="contained"
                    color={config.color}
                >
                    {confirmButtonText}
                </Button>
            </DialogActions>
        </Dialog>

    )
}