import { MapStore, StoreImageDownloadData } from "@/types/Store";
import { Box, Drawer, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import LoadingErrorContainer from "../feedback/LoadingErrorContainer";
import { useState } from "react";
import { useResponsive } from "@/hooks/useResponsive";
import { useDialogState } from "@/hooks/useDialogState";
import StoreImageGallery from "../image/StoreImageGallery";
import StoreDetailsSection from "./StoreDetailsSection";
import StoreCloseActionsPanel from "./StoreCloseActionsPanel";
import { useStore } from "@/hooks/api/useStores";
import { useStoreImages } from "@/hooks/api/useImages";

type StoreInfoDrawerProps = {
  open: boolean;
  store: MapStore | null;
  onClose: () => void;
}

/**
 * 店舗情報の詳細表示用ドロワーコンポーネント。
 * 店舗情報、画像、トッピングコール情報、店舗閉店ボタンなどを表示します。
 *
 * 大きなコンポーネントを機能ごとに分割してメンテナビリティを向上
 */
export function StoreInfoDrawer({ open, store, onClose }: StoreInfoDrawerProps) {

  // ブラウザ幅を監視してDrawerの表示位置を決定
  const { isMobile } = useResponsive()

  // 共通ダイアログ状態管理フック
  const {
    confirmDialog: storeCloseDialog,
    setConfirmDialog: setStoreCloseDialog,
    resultDialog,
    setResultDialog
  } = useDialogState()

  const {
    confirmDialog: imageDeleteDialog,
    setConfirmDialog: setImageDeleteDialog,
    resultDialog: imageDeleteResult,
    setResultDialog: setImageDeleteResult
  } = useDialogState()

  // 画像モーダル用の状態
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<StoreImageDownloadData | null>(null)
  const storeId = store?.id ? String(store.id) : "" // storeがnullなら、確実に空文字列""にする
  const isQueryEnabled = open && !!storeId   // storeIdが""なら、ここはfalseになる

  // APIクエリ
  const { data: imageData, isLoading: isImageLoading, isError: isImageError, error: imageError } = useStoreImages(storeId, isQueryEnabled)

  const { data: storeData, isLoading: isStoreLoading, isError: isStoreError, error: storeError } = useStore(storeId, isQueryEnabled)

  const isLoading = isImageLoading || isStoreLoading
  const hasError = isImageError || isStoreError
  const errorMessage = isImageError ? (imageError as Error).message : isStoreError ? (storeError as Error).message : null

  return (
    <Drawer
      anchor={isMobile ? 'bottom' : 'left'}
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: "100vw", sm: 400 },
            height: { xs: "50vh", sm: "100vh" },
            borderTopLeftRadius: { xs: 16, sm: 0 },
            borderTopRightRadius: { xs: 16, sm: 0 },
            p: 3,
            boxSizing: "border-box",
            backgroundColor: "#f8f4f4"
          }
        }
      }}
      ModalProps={{
        keepMounted: true
      }}
    >
      <Box sx={{ position: "relative" }}>
        <IconButton
          onClick={onClose}
          sx={{ position: "absolute", top: 3, right: 3, zIndex: 1 }}
          aria-label="閉じる"
        >
          <CloseIcon />
        </IconButton>
        {isLoading || hasError ? (
          <LoadingErrorContainer loading={isLoading} error={errorMessage} />
        ) : (
          <>
            <StoreImageGallery
              store={store}
              imageData={imageData || []}
              modalOpen={modalOpen}
              setModalOpen={setModalOpen}
              selectedImage={selectedImage}
              setSelectedImage={setSelectedImage}
              imageDeleteDialog={imageDeleteDialog}
              setImageDeleteDialog={setImageDeleteDialog}
              imageDeleteResult={imageDeleteResult}
              setImageDeleteResult={setImageDeleteResult}
            />

            <StoreDetailsSection
              storeData={storeData}
            />

            <StoreCloseActionsPanel
              store={store}
              storeCloseDialog={storeCloseDialog}
              setStoreCloseDialog={setStoreCloseDialog}
              resultDialog={resultDialog}
              setResultDialog={setResultDialog}
              onClose={onClose}
            />
          </>
        )}
      </Box>
    </Drawer>
  )
}
