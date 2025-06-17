import { ResultDialogType } from "@/types/Store";
import { useState } from "react";

/**
 * ダイアログ状態管理の共通フック
 * 確認ダイアログと結果ダイアログの状態を一元管理します
 */
export interface BaseDialogState {
    open: boolean;
    message: string;
    targetName?: string;
}

// 確認ダイアログ用（ローディング状態が必要）
export interface DialogState extends BaseDialogState {
    isLoading: boolean;
}

export interface ResultDialogState extends BaseDialogState {
    type: ResultDialogType;
    title: string;
}

export function useDialogState() {
    const [confirmDialog, setConfirmDialog] = useState<DialogState>({
        open: false,
        message: '',
        targetName: undefined,
        isLoading: false
    })

    const [resultDialog, setResultDialog] = useState<ResultDialogState>({
        open: false,
        type: 'success',
        title: '',
        message: '',
        targetName: undefined
    })

    const openConfirmDialog = (message: string, targetName?: string) => {
        setConfirmDialog({
            open: true,
            message: message,
            targetName: targetName,
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
            targetName: targetName
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