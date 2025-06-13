import { Warning } from "@mui/icons-material";
import { Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Typography } from "@mui/material";

/**
 * 店舗閉店確認ダイアログコンポーネント。
 * - 閉店確認のUI・操作を提供
 */

interface ConfirmDialogProps {
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

/**
 * StoreCloseConfirmDialogコンポーネント。
 * 
 * - 店舗閉店を確認するためのダイアログを提供します。
 * - ユーザーに閉店操作の確認を求め、キャンセルや実行ボタンをクリックすることで操作を完了できます。
 * - ローディング状態を表示することができ、実行ボタンの色をカスタマイズ可能です。
 * 
 * @param {boolean} open - ダイアログの表示状態。
 * @param {string} title - ダイアログのタイトル。
 * @param {string} message - 確認メッセージ。
 * @param {string} [targetName] - 閉店対象の名前（オプション）。
 * @param {() => void} onClose - キャンセルボタンをクリックした際のコールバック。
 * @param {() => void} onConfirm - 実行ボタンをクリックした際のコールバック。
 * @param {boolean} [isLoading=false] - ローディング状態を表すフラグ。
 * @param {string} [confirmButtonText="実行"] - 実行ボタンのテキスト。
 * @param {string} [cancelButtonText="キャンセル"] - キャンセルボタンのテキスト。
 * @param {'error' | 'primary' | 'secondary' | 'success' | 'info' | 'warning'} [confirmButtonColor="primary"] - 実行ボタンの色。
 * 
 * @returns {JSX.Element} 店舗閉店確認のダイアログコンポーネント。
 */

export function ConfirmDialog({
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
}: ConfirmDialogProps) {
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
                    {isLoading ? <CircularProgress size={24} color="inherit" /> : confirmButtonText}
                </Button>
            </DialogActions>
        </Dialog>
    )
}