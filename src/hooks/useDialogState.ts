import { ResultDialogType } from "@/types/Store";
import { useState } from "react";

/**
 * ダイアログ状態管理の共通フック
 * 確認ダイアログと結果ダイアログの状態を一元管理します
 */
export interface DialogState {
    open: boolean;
    message: string;
    targetName?: string;
    isLoading?: boolean;
}

export interface ResultDialogState extends DialogState {
    type: ResultDialogType;
    title: string;
}

export function useDialogState() {
    const [confirmDialog, setConfirmDialog] = useState<DialogState>({
        open: false,
        message: '',
        targetName: '',
        isLoading: false
    })

    const [resultDialog, setResultDialog] = useState<ResultDialogState>({
        open: false,
        type: 'success',
        title: '',
        message: '',
        targetName: ''
    })

    const openConfirmDialog = (message: string, targetName?: string) => {
        setConfirmDialog({
            open: true,
            message: message,
            targetName,
            isLoading: false
        })
    }

    const closeConfirmDialog = () => {
        setConfirmDialog(prev => ({ ...prev, open: false, isLoading: false }))
    }

    const setConfirmLoading = (isLoading: boolean) => {
        setConfirmDialog(prev => ({ ...prev, isLoading }))
    }

    const openResultDialog = (
        type: ResultDialogType,
        title: string,
        message: string,
        targetName?: string
    ) => {
        setResultDialog({
            open: true,
            type,
            title,
            message,
            targetName: targetName || ''
        })
    }

    const closeResultDialog = () => {
        setResultDialog(prev => ({ ...prev, open: false }))
    }

    return {
        confirmDialog,
        setConfirmDialog,
        openConfirmDialog,
        closeConfirmDialog,
        setConfirmLoading,
        resultDialog,
        setResultDialog,
        openResultDialog,
        closeResultDialog
    }
}