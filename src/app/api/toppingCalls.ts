import ApiClient from "@/lib/ApiClient"

const api = ApiClient.getInstance()

export const getToppingCallOptions = async () => {
    try {
        const res = await api.get('/toppings/calloptions')
        return res.data.data
    } catch (error) {
        throw ApiClient.handlerError(error, "トッピング・コールオプション時にエラーが発生しました。")
    }
}
