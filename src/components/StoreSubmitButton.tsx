import { Button, CircularProgress } from "@mui/material";

interface StoreSubmitButtonProps {
    label: string;
    loading: boolean;

}

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