import { DialogState, ResultDialogState } from "@/hooks/useDialogState";
import { useAuthStore } from "@/lib/AuthStore";
import { auth } from "@/lib/firebase";
import { MapStore, StoreImageDownloadData } from "@/types/Store"
import { AddPhotoAlternate, EditNote } from "@mui/icons-material";
import { Alert, Box, CircularProgress, IconButton, ImageList, ImageListItem, ImageListItemBar, Tooltip, Typography } from "@mui/material";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction, useState } from "react";
import StoreImageModal from "../modals/StoreImageModal";
import { ConfirmDialog } from "../modals/ConfirmDialog";
import { ResultDialog } from "../modals/ResultDialog";
import { getDisplayMenuName } from "@/utils/storeUtils";
import { MENU_TYPE_LABELS } from "@/constants/ui";
import { useDeleteStoreImage, useStoreImages } from "@/hooks/api/useImages";

interface StoreImageGalleryProps {
    store: MapStore | null;
    storeId: string;
    modalOpen: boolean;
    setModalOpen: (open: boolean) => void;
    selectedImage: StoreImageDownloadData | null;
    setSelectedImage: (image: StoreImageDownloadData | null) => void;
    imageDeleteDialog: DialogState;
    setImageDeleteDialog: Dispatch<SetStateAction<DialogState>>;
    imageDeleteResult: ResultDialogState;
    setImageDeleteResult: Dispatch<SetStateAction<ResultDialogState>>;
    enabled: boolean;
}

/**
 * 店舗画像ギャラリーコンポーネント
 * 画像表示、モーダル、削除機能を管理します
 */
export default function StoreImageGallery({
    store,
    storeId,
    modalOpen,
    setModalOpen,
    selectedImage,
    setSelectedImage,
    imageDeleteDialog,
    setImageDeleteDialog,
    imageDeleteResult,
    setImageDeleteResult,
    enabled
}: StoreImageGalleryProps) {
    const router = useRouter()
    const { isAuthenticated, user } = useAuthStore()
    const [imageDeleteTargetId, setImageDeleteTargetId] = useState<string | number | null>(null)
    const deleteImageMutation = useDeleteStoreImage()
    // APIクエリ
    const { data: imageData, isLoading: isImageLoading, isError: isImageError } = useStoreImages(storeId, enabled)


    const handleImageClick = (img: StoreImageDownloadData) => {
        setSelectedImage(img)
        setModalOpen(true)
    }

    const handleModalClose = () => {
        setModalOpen(false)
        setSelectedImage(null)
    }

    // 画像更新メニュー押下イベント
    const handleImageUpdate = (imageId: string | number) => {
        if (!store?.id) return

        // 画像更新画面へ遷移
        router.push(`/stores/images/${String(store.id)}/edit/${imageId}`)
    }

    // 画像削除メニュー押下イベント
    const handleImageDelete = async (imageId: string | number) => {
        // 削除対象のIDを保存してダイアログを表示
        setImageDeleteTargetId(imageId)
        const targetImageName = getDisplayMenuName(selectedImage)

        setImageDeleteDialog({
            open: true,
            message: "以下の画像を削除します。宜しいでしょうか？",
            targetName: targetImageName,
            isLoading: false
        })
    }

    // 画像削除確認ダイアログの実行ハンドラ
    const handleImageDeleteConfirm = async () => {
        if (!imageDeleteTargetId || !store?.id) return

        setImageDeleteDialog(prev => ({ ...prev, isLoading: true }))
        // 削除対象の画像情報を保存（ダイアログ表示用）
        const targetImageName = getDisplayMenuName(selectedImage)

        try {
            if (!auth.currentUser) throw new Error('ユーザーがログインしていません。再度ログインしてください。')
            const idToken = await auth.currentUser.getIdToken()
            if (!idToken) throw new Error('認証トークンの取得に失敗しました。')

            // 画像削除処理実行
            await deleteImageMutation.mutateAsync({
                storeId: String(store.id),
                imageId: String(imageDeleteTargetId),
                idToken
            })

            setModalOpen(false)
            setSelectedImage(null)
            setImageDeleteDialog({ open: false, message: '', isLoading: false })
            setImageDeleteTargetId(null)

            // 成功ダイアログ表示
            setImageDeleteResult({
                open: true,
                type: 'success',
                title: '画像削除成功',
                message: `${targetImageName}を削除しました。`
            })
        } catch (error) {
            console.error('画像削除エラー', error)
            setImageDeleteDialog({ open: false, message: '', isLoading: false })
            setImageDeleteTargetId(null)

            // エラーダイアログを表示
            setImageDeleteResult({
                open: true,
                type: 'error',
                title: '画像削除エラー',
                message: error instanceof Error ? error.message : '画像削除中にエラーが発生しました。',
                targetName: targetImageName
            })
        }
    }

    // 画像削除確認ダイアログのキャンセルハンドラ
    const handleImageDeleteCancel = () => {
        setImageDeleteDialog({ open: false, message: '', isLoading: false })
        setImageDeleteTargetId(null)
    }

    // 画像削除結果ダイアログの確認ハンドラ
    const handleImageDeleteResultConfirm = () => {
        setImageDeleteResult(prev => ({ ...prev, open: false }))
    }

    return (
        <>
            {/* アクションボタン */}
            {isAuthenticated && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Tooltip
                        title="店舗編集画面"
                        slotProps={{
                            tooltip: {
                                sx: {
                                    fontSize: '0.85rem', // 12px相当
                                    fontWeight: 500
                                }
                            }
                        }}
                    >
                        <span>
                            <IconButton aria-label="更新" onClick={() => router.push(`/stores/${String(store?.id)}/edit`)} disabled={!store?.id}>
                                <EditNote />
                            </IconButton>
                        </span>
                    </Tooltip>
                    <Tooltip
                        title="画像アップロード画面"
                        slotProps={{
                            tooltip: {
                                sx: {
                                    fontSize: '0.85rem', // 12px相当
                                    fontWeight: 500
                                }
                            }
                        }}
                    >
                        <span>
                            <IconButton aria-label="画像アップロード" onClick={() => router.push(`/stores/images/${String(store?.id)}/upload`)} disabled={!store?.id}>
                                <AddPhotoAlternate />
                            </IconButton>
                        </span>
                    </Tooltip>
                </Box>
            )}

            <Box sx={{ pt: 2 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                    {store?.branch_name
                        ? `${store.store_name} ${store.branch_name}`
                        : store?.store_name
                    }
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                    {store?.address}
                </Typography>
                {/* 画像ギャラリーのローディングとエラーハンドリング */}
                {isImageLoading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 180, py: 2 }}>
                        <CircularProgress />
                    </Box>
                )}
                {isImageError && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                        画像の読み込みに失敗しました。
                    </Alert>
                )}
                {/* 画像スライダー */}
                {!isImageLoading && !isImageError && (
                    imageData && imageData.length > 0 ? (
                        <Box sx={{ width: "100%", overflowX: "auto", mb: 4 }}>
                            <ImageList
                                sx={{
                                    flexWrap: "nowrap",
                                    display: "flex",
                                    overflow: "auto",
                                    minHeight: 180
                                }}
                                cols={2.5}
                                rowHeight={180}
                            >
                                {imageData.map((img) => (
                                    <ImageListItem key={img.id} sx={{ minWidth: 240, position: 'relative' }}>
                                        <Image
                                            src={img.image_url}
                                            alt={img.menu_name}
                                            fill
                                            loading="lazy"
                                            style={{ borderRadius: 8, objectFit: "cover", cursor: "pointer" }}
                                            onClick={() => handleImageClick(img)}
                                            sizes='(max-width: 768px) 100vw, 50vw'
                                        />
                                        <ImageListItemBar
                                            title={`【${MENU_TYPE_LABELS[img.menu_type]}】${img.menu_name}`}
                                            position="bottom"
                                            sx={{
                                                '& .MuiImageListItemBar-title': {
                                                    fontSize: '0.85rem', // 12px相当
                                                    lineHeight: 1.2
                                                }
                                            }}
                                        />
                                    </ImageListItem>
                                ))}
                            </ImageList>
                        </Box>
                    ) : (
                        <Typography variant="body1" color="text.secondary" sx={{ mt: 2, mb: 4 }}>
                            画像はまだ投稿されていません。
                        </Typography>
                    )
                )}
            </Box>
            {/* 画像モーダル */}
            <StoreImageModal
                open={modalOpen}
                image={selectedImage}
                onClose={handleModalClose}
                menuTypeLabels={MENU_TYPE_LABELS}
                currentUserId={user?.uid}
                onUpdate={handleImageUpdate}
                onDelete={handleImageDelete}
            />

            {/* 画像削除確認ダイアログ */}
            <ConfirmDialog
                open={imageDeleteDialog.open}
                title="画像情報削除確認"
                message={imageDeleteDialog.message}
                targetName={imageDeleteDialog.targetName}
                onClose={handleImageDeleteCancel}
                onConfirm={handleImageDeleteConfirm}
                isLoading={imageDeleteDialog.isLoading}
                confirmButtonText="削除する"
                confirmButtonColor="error"
            />
            {/* 画像削除結果ダイアログ */}
            <ResultDialog
                open={imageDeleteResult.open}
                type={imageDeleteResult.type}
                title={imageDeleteResult.title}
                message={imageDeleteResult.message}
                targetName={imageDeleteResult.targetName}
                onConfirm={handleImageDeleteResultConfirm}
            />
        </>
    )
}