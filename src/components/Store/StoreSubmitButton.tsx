import { Button, CircularProgress } from "@mui/material";

interface StoreSubmitButtonProps {
    label: string;
    loading: boolean;
}

/**
 * @summary
 *   店舗情報登録・更新用の送信ボタンコンポーネント。
 *   - ボタンラベル、ローディング状態を props として受け取ります。
 *   - ローディング状態中はボタンを無効化し、プログレスを表示します。
 *   - それ以外の場合はボタンを有効化し、ボタンラベルを表示します。
 *
 * @param {StoreSubmitButtonProps} props
 * @prop {string} label - ボタンラベル
 * @prop {boolean} loading - ローディング状態
 *
 * @returns {JSX.Element} Send button component
 */
export function StoreSubmitButton({ label, loading }: StoreSubmitButtonProps) {
    return (
        <Button
            variant="contained" type="submit"
            className="mt-4 w-full font-bold" disabled={loading}
        >
            {loading ? <CircularProgress size={24} color="inherit" /> : label}
        </Button>
    )
}