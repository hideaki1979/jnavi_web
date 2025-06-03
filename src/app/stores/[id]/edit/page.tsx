import { StoreFormInput, StoreInputSchema } from "@/validations/store"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"

export default function StoreUpdatePages() {

    const router = useRouter()

    // フォームの状態管理
    const { control, handleSubmit, formState: { errors } } = useForm<StoreFormInput>({
        resolver: zodResolver(StoreInputSchema),
        defaultValues: {
            store_name: "",
            branch_name: "",
            address: "",
            business_hours: "",
            regular_holidays: "",
            prior_meal_voucher: false,
            is_all_increased: false,
            is_lot: false,
            topping_details: "",
            call_details: "",
            lot_detail: ""

        }
    })

    return (
        <div>page</div>
    )
}
