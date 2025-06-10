import { FormattedToppingOptionNameStoreData, MapStore, ResultDialogType, StoreImageDownloadData } from "@/types/Store";
import { Accordion, AccordionDetails, AccordionSummary, Box, Button, Divider, Drawer, IconButton, ImageList, ImageListItem, ImageListItemBar, Tooltip, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getStoreById, getStoreImages, storeClose } from "@/app/api/stores";
import Image from "next/image";
import LoadingErrorContainer from "./feedback/LoadingErrorContainer";
import { AddPhotoAlternate, EditNote, ExpandMore } from "@mui/icons-material";
import { RenderToppingOptions } from "./RenderToppingOptions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import StoreImageModal from "./modals/StoreImageModal";
import { StoreCloseConfirmDialog } from "./modals/StoreCloseConfirmDialog";
import { ResultDialog } from "./modals/ResultDialog";
import { useAuthStore } from "@/lib/AuthStore";

type StoreInfoDrawerProps = {
  open: boolean;
  store: MapStore | null;
  onClose: () => void;
}

const MENU_TYPE_LABELS: Record<string, string> = {
  "1": "通常",
  "2": "限定"
}

/**
 * 店舗情報の詳細表示用ドロワーコンポーネント。
 *
 * 店舗情報、画像、トッピングコール情報、店舗閉店ボタンなどを表示します。
 *
 * @param {boolean} open ドロワーの開閉状態
 * @param {MapStore | null} store 店舗情報
 * @param {() => void} onClose ドロワーの閉じるハンドラ
 */
export function StoreInfoDrawer({ open, store, onClose }: StoreInfoDrawerProps) {

  const { data: imageData, isLoading: isImageLoading, isError: isImageError, error: imageError } = useQuery<StoreImageDownloadData[], Error>({
    queryKey: ["imageData", store?.id],
    queryFn: () => getStoreImages(String(store?.id)),
    enabled: !!store?.id
  })

  const { data: storeData, isLoading: isStoreLoading, isError: isStoreError, error: storeError } = useQuery<FormattedToppingOptionNameStoreData, Error>({
    queryKey: ["storeDetail", store?.id],
    queryFn: () => getStoreById(String(store?.id)),
    enabled: !!store?.id
  })

  const router = useRouter()

  const queryClient = useQueryClient()

  // 画像モーダル用の状態
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<StoreImageDownloadData | null>(null)

  // ダイアログ用の状態
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [resultDialogOpen, setResultDialogOpen] = useState(false)
  const [resultDialogType, setResultDialogType] = useState<ResultDialogType>('success')
  const [resultMessage, setResultMessage] = useState("")
  const [isClosing, setIsClosing] = useState(false)

  // Zustandから認証状態を取得
  const { isAuthenticated } = useAuthStore()

  const handleImageClick = (img: StoreImageDownloadData) => {
    setSelectedImage(img)
    setModalOpen(true)
  }

  const handleModalClose = () => {
    setModalOpen(false)
    setSelectedImage(null)
  }

  const handleCloseStore = async () => {
    if (!store) return
    setIsClosing(true)
    try {
      const res = await storeClose(String(store?.id), store?.store_name)
      if (res.status === 'success') {
        setConfirmDialogOpen(false)
        setResultDialogType('success')
        setResultMessage('以下の店舗を閉店しました。')
        setResultDialogOpen(true)
      }
    } catch (error) {
      console.error('閉店処理に失敗しました：', error)
      setConfirmDialogOpen(false)
      setResultDialogType('error')
      setResultMessage(error instanceof Error ? error.message : '閉店処理中にエラーが発生しました。')
      setResultDialogOpen(true)

    } finally {
      setIsClosing(false)
    }
  }

  const handleResultConfirm = () => {
    setResultDialogOpen(false)
    if (resultDialogType === 'success') {
      // キャッシュを無効化して画面遷移（再度Map情報を取得するため）
      queryClient.invalidateQueries({ queryKey: ['mapData'] })
      onClose()
      router.replace('/stores/map')
    }
  }

  const isLoading = isImageLoading || isStoreLoading
  const hasError = isImageError || isStoreError
  const errorMessage = isImageError ? (imageError as Error).message : isStoreError ? (storeError as Error).message : null

  return (
    <Drawer
      anchor={typeof window !== "undefined" && window.innerWidth < 650 ? "bottom" : "left"}
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
                  <IconButton aria-label="更新" onClick={() => router.push(`/stores/${String(store?.id)}/edit`)}>
                    <EditNote />
                  </IconButton>
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
                  <IconButton aria-label="画像アップロード" onClick={() => router.push(`/stores/images/${String(store?.id)}/upload`)}>
                    <AddPhotoAlternate />
                  </IconButton>
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
              {/* 画像スライダー */}
              {imageData && imageData.length > 0 ? (
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
                      <ImageListItem key={img.id} sx={{ minWidth: 240 }}>
                        <Image
                          src={img.image_url}
                          alt={img.menu_name}
                          width={240}
                          height={180}
                          loading="lazy"
                          style={{ borderRadius: 8, width: "auto", height: "100%", objectFit: "cover", cursor: "pointer" }}
                          onClick={() => handleImageClick(img)}
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
              ) : null}
            </Box>
            {/* 画像モーダル */}
            <StoreImageModal
              open={modalOpen}
              image={selectedImage}
              onClose={handleModalClose}
              menuTypeLabels={MENU_TYPE_LABELS}
            />
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                営業時間：{storeData?.business_hours}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                定休日：{storeData?.regular_holidays}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                事前食券有無：{storeData?.prior_meal_voucher ? "有り" : "無し"}
              </Typography>
            </Box>
            <Divider sx={{ my: 2 }} />
            {storeData?.preCallFormatted && Object.keys(storeData.preCallFormatted).length > 0 && (
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="body1" fontWeight="bold">事前トッピングコール情報</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {RenderToppingOptions(storeData?.preCallFormatted)}
                </AccordionDetails>
              </Accordion>
            )}

            {storeData?.postCallFormatted && Object.keys(storeData.postCallFormatted).length > 0 && (
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="body1" fontWeight="bold">着丼前トッピングコール情報</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {RenderToppingOptions(storeData?.postCallFormatted)}
                </AccordionDetails>
              </Accordion>
            )}
            <Divider sx={{ my: 2 }} />
            <Typography variant="body2" color="text.secondary" gutterBottom>
              トッピング補足：
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom whiteSpace="pre-line" mb={2}>
              {storeData?.topping_details}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              コール補足：
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom whiteSpace="pre-line" mb={2}>
              {storeData?.call_details}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom mb={2}>
              全マシコール有無：{storeData?.is_all_increased ? "あり" : "なし"}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              ロット制有無：{storeData?.is_lot ? "あり" : "なし"}
            </Typography>
            {storeData?.is_lot && (
              <>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  ロット制補足：
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom whiteSpace="pre-line" mb={2}>
                  {storeData?.lot_detail}
                </Typography>
              </>
            )}
            {/* 閉店ボタン */}
            <Box sx={{ mt: 4, pt: 2, borderTop: 2, borderColor: 'divider' }}>
              <Button
                variant="contained"
                color="error"
                fullWidth
                startIcon={<CloseIcon />}
                onClick={() => setConfirmDialogOpen(true)}
                sx={{ py: 2, fontWeight: "bold" }}
              >
                店舗を閉店する
              </Button>
            </Box>
            {/* 閉店確認ダイアログ */}
            <StoreCloseConfirmDialog
              open={confirmDialogOpen}
              title="店舗閉店の確認"
              message="以下の店舗を閉店状態にします。よろしいでしょうか？"
              targetName={store?.branch_name
                ? `${store.store_name} ${store.branch_name}`
                : store?.store_name || ''
              }
              onClose={() => setConfirmDialogOpen(false)}
              onConfirm={handleCloseStore}
              isLoading={isClosing}
              confirmButtonText="閉店する"
              confirmButtonColor="error"
            />
            {/* 閉店結果ダイアログ */}
            <ResultDialog
              open={resultDialogOpen}
              type={resultDialogType}
              title={resultDialogType === 'success' ? "閉店処理完了" : "閉店処理エラー"}
              message={resultMessage}
              targetName={store?.branch_name
                ? `${store.store_name} ${store.branch_name}`
                : store?.store_name || ''
              }
              onConfirm={handleResultConfirm}
            />
          </>
        )}
      </Box>
    </Drawer>
  )
}
