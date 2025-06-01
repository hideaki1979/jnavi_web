import { FormattedToppingOptionNameStoreData, MapStore, StoreImageDownloadData } from "@/types/Store";
import { Accordion, AccordionDetails, AccordionSummary, Box, Button, Divider, Drawer, IconButton, ImageList, ImageListItem, ImageListItemBar, Tooltip, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useQuery } from "@tanstack/react-query";
import { getStoreById, getStoreImages } from "@/app/api/stores";
import Image from "next/image";
import LoadingErrorContainer from "./feedback/LoadingErrorContainer";
import { AddPhotoAlternate, EditNote, ExpandMore } from "@mui/icons-material";
import { RenderToppingOptions } from "./RenderToppingOptions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import StoreImageModal from "./modals/StoreImageModal";

type StoreInfoDrawerProps = {
  open: boolean;
  store: MapStore | null;
  onClose: () => void;
}

const MENU_TYPE_LABELS: Record<string, string> = {
  "1": "通常",
  "2": "限定"
}

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

  // 画像モーダル用の状態
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<StoreImageDownloadData | null>(null)

  const handleImageClick = (img: StoreImageDownloadData) => {
    setSelectedImage(img)
    setModalOpen(true)
  }

  const handleModalClose = () => {
    setModalOpen(false)
    setSelectedImage(null)
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
                <IconButton aria-label="更新" onClick={() => { }}>
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
                <IconButton aria-label="画像アップロード" onClick={() => router.push(`/stores/images/upload/${String(store?.id)}`)}>
                  <AddPhotoAlternate />
                </IconButton>
              </Tooltip>
            </Box>

            <Box sx={{ pt: 5 }}>
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
                          style={{ borderRadius: 8, width: "100%", height: "100%", objectFit: "cover", cursor: "pointer" }}
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
                onClick={() => { }}
                sx={{ py: 2, fontWeight: "bold" }}
              >
                店舗を閉店する
              </Button>
            </Box>
          </>
        )}
      </Box>
    </Drawer>
  )
}
