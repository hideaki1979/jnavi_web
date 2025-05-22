import { z } from "zod";

export const StoreInputSchema = z.object({
    store_name: z.string().min(1, "店舗名は必須です"),
    branch_name: z.string().optional(),
    address: z.string().min(1, "住所は必須です"),
    business_hours: z.string().min(1, "営業時間は必須です"),
    regular_holidays: z.string().min(1, "定休日は必須です"),
    prior_meal_voucher: z.boolean(),
    is_all_increased: z.boolean(),
    is_lot: z.boolean(),
    topping_details: z.string().optional(),
    call_details: z.string().optional(),
    lot_detail: z.string().optional()
})

export type StoreFormInput = z.infer<typeof StoreInputSchema>