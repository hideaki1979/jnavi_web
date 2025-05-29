import { MapStore, StoreImageDownloadData } from "@/types/Store";
import { Box, Drawer, IconButton, ImageList, ImageListItem, ImageListItemBar, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useQuery } from "@tanstack/react-query";
import { getStoreImages } from "@/app/api/stores";
import Image from "next/image";
import LoadingErrorContainer from "./feedback/LoadingErrorContainer";

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

  const { data: imageData, isLoading, isError, error } = useQuery<StoreImageDownloadData[], Error>({
    queryKey: ["imageData", store?.id],
    queryFn: () => getStoreImages(String(store?.id)),
    enabled: !!store?.id
  })

  if (isLoading || isError) {
    return <LoadingErrorContainer loading={isLoading} error={isError ? (error as Error).message : null} />
  }

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
          }
        }
      }}
      ModalProps={{
        keepMounted: true
      }}
    >
      <Box sx={{ position: "relative", height: "100%" }}>
        <IconButton
          onClick={onClose}
          sx={{ position: "absolute", top: 4, right: 4, zIndex: 1 }}
          aria-label="閉じる"
        >
          <CloseIcon />
        </IconButton>
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
                      style={{ borderRadius: 8, width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    <ImageListItemBar
                      title={`【${MENU_TYPE_LABELS[img.menu_type]}】${img.menu_name}`}
                      position="bottom"
                    />
                  </ImageListItem>
                ))}
              </ImageList>
            </Box>
          ) : null}
        </Box>
      </Box>
    </Drawer>
  )
}
