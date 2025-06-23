import { FormattedToppingOptionNameStoreData } from "@/types/Store";
import { ExpandMore } from "@mui/icons-material";
import { Accordion, AccordionDetails, AccordionSummary, Box, Divider, Typography } from "@mui/material";
import { RenderToppingOptions } from "../toppingCallOptions/RenderToppingOptions";

interface StoreDetailsSectionProps {
    storeData?: FormattedToppingOptionNameStoreData;
}

/**
 * 店舗詳細情報セクションコンポーネント
 * 営業時間、定休日、トッピングコール情報、補足情報などを表示します
 */
export default function StoreDetailsSection({ storeData }: StoreDetailsSectionProps) {
    return (
        <>
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
            <Typography variant="body2" color="text.secondary" gutterBottom sx={{ whiteSpace: 'pre-line' }} mb={2}>
                {storeData?.topping_details}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
                コール補足：
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom sx={{ whiteSpace: 'pre-line' }} mb={2}>
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
                    <Typography variant="body2" color="text.secondary" gutterBottom sx={{ whiteSpace: 'pre-line' }} mb={2}>
                        {storeData?.lot_detail}
                    </Typography>
                </>
            )}
        </>
    )
}