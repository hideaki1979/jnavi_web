import { Box, CircularProgress, Typography } from "@mui/material";

interface LoadingErrorContainerProps {
    loading: boolean;
    error?: string | null;
}

export default function LoadingErrorContainer({ loading, error }: LoadingErrorContainerProps) {
    if (loading) return (
        <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="100vh" >
            <CircularProgress color="primary" />
            <Typography variant="body2" className="mt-4 text-gray-400">Loading...</Typography>
        </Box>
    )

    if (error) {
        return (
            <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="40vh">
                <Typography color="error">{error}</Typography>
            </Box>
        )
    }

}