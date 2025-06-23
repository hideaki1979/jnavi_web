import { DialogState, ResultDialogState } from "@/hooks/useDialogState";
import { MapStore } from "@/types/Store";
import { Close } from "@mui/icons-material";
import { Box, Button } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction, useState } from "react";
import { ConfirmDialog } from "../modals/ConfirmDialog";
import { ResultDialog } from "../modals/ResultDialog";
import { getDisplayStoreName } from "@/utils/storeUtils";
import { useCloseStore } from "@/hooks/api/useStores";
import { useAuthStore } from "@/lib/AuthStore";

interface StoreActionsPanelProps {
    store: MapStore | null;
    storeCloseDialog: DialogState;
    setStoreCloseDialog: Dispatch<SetStateAction<DialogState>>
    resultDialog: ResultDialogState;
    setResultDialog: Dispatch<SetStateAction<ResultDialogState>>
    onClose: () => void;
}

/**
 * 店舗アクションパネルコンポーネント
 * 閉店ボタンと関連するダイアログを管理します
 */
export default function StoreCloseActionsPanel({
    store,
    storeCloseDialog,
    setStoreCloseDialog,
    resultDialog,
    setResultDialog,
    onClose
}: StoreActionsPanelProps) {
    const router = useRouter()
    const queryClient = useQueryClient()
    const [isClosing, setIsClosing] = useState(false)
    const closeStoreMutation = useCloseStore()
    const { isAuthenticated } = useAuthStore()

    const handleCloseStoreClick = () => {
        const storeName = getDisplayStoreName(store)
        setStoreCloseDialog({
            open: true,
            message: '以下の店舗を閉店状態にします',
            targetName: storeName,
            isLoading: false
        })
    }

    const handleCloseStore = async () => {
        if (!store) return
        setIsClosing(true)
        setStoreCloseDialog(prev => ({ ...prev, isLoading: true }))
        try {
            await closeStoreMutation.mutateAsync({
                id: String(store.id),
                storeName: store.store_name
            })
            setStoreCloseDialog({ open: false, message: '', isLoading: false })
            const storeName = getDisplayStoreName(store)
            setResultDialog({
                open: true,
                type: 'success',
                title: '閉店処理完了',
                message: '以下の店舗を閉店しました',
                targetName: storeName
            })
        } catch (error) {
            console.error('閉店処理に失敗しました：', error)
            setStoreCloseDialog({ open: false, message: '', isLoading: false })
            const storeName = getDisplayStoreName(store)
            setResultDialog({
                open: true,
                type: 'error',
                title: '閉店処理エラー',
                message: error instanceof Error ? error.message : '閉店処理中にエラーが発生しました。',
                targetName: storeName
            })
        } finally {
            setIsClosing(false)
        }
    }

    const handleCloseStoreCancel = () => {
        setStoreCloseDialog({ open: false, message: '', isLoading: false })
    }

    const handleResultConfirm = () => {
        setResultDialog(prev => ({ ...prev, open: false }))
        if (resultDialog.type === 'success') {
            // キャッシュを無効化して画面遷移（再度Map情報を取得するため）
            queryClient.invalidateQueries({ queryKey: ['mapData'] })
            onClose()
            router.push(`/stores/map`)
        }
    }

    {/* 閉店ボタン */ }
    return (
        <>
            {isAuthenticated && (
                <Box sx={{ mt: 4, pt: 2, borderTop: 2, borderColor: 'divider' }}>
                    <Button
                        variant="contained"
                        color="error"
                        fullWidth
                        startIcon={<Close />}
                        onClick={handleCloseStoreClick}
                        sx={{ py: 2, fontWeight: "bold" }}
                    >
                        店舗を閉店する
                    </Button>
                </Box>
            )}
            {/* 閉店確認ダイアログ */}
            <ConfirmDialog
                open={storeCloseDialog.open}
                title="店舗閉店の確認"
                message={storeCloseDialog.message}
                targetName={storeCloseDialog.targetName}
                onClose={handleCloseStoreCancel}
                onConfirm={handleCloseStore}
                isLoading={storeCloseDialog.isLoading || isClosing}
                confirmButtonText="閉店する"
                confirmButtonColor="error"
            />
            {/* 閉店結果ダイアログ */}
            <ResultDialog
                open={resultDialog.open}
                type={resultDialog.type}
                title={resultDialog.title}
                message={resultDialog.message}
                targetName={resultDialog.targetName}
                onConfirm={handleResultConfirm}
            />
        </>
    )
}