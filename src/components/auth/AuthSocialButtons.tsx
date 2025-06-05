import { signInWithFacebook, signInWithGitHub, signInWithGoogle } from "@/lib/auth";
import { Facebook, GitHub, Google } from "@mui/icons-material";
import { Box, Button } from "@mui/material";
import { useRouter } from "next/navigation";

export function AuthSocialButtons() {
    const router = useRouter()

    const handleGoogleAuth = async () => {
        await signInWithGoogle()
        router.replace(`/stores/map`)
    };

    const handleFacebookAuth = async () => {
        await signInWithFacebook()
        router.replace(`/stores/map`)
    };

    const handleGitHubAuth = async () => {
        await signInWithGitHub()
        router.replace(`/stores/map`)
    };
    return (
        <Box display="flex" flexDirection="column" gap={2}>
            <Button
                variant="outlined"
                fullWidth
                startIcon={<Google />}
                onClick={handleGoogleAuth}
                sx={{ py: 1.5 }}
            >
                Googleでログイン
            </Button>
            <Button
                variant="outlined"
                fullWidth
                startIcon={<Facebook />}
                onClick={handleFacebookAuth}
                sx={{ py: 1.5 }}
            >
                Facebookでログイン
            </Button>
            <Button
                variant="outlined"
                fullWidth
                startIcon={<GitHub />}
                onClick={handleGitHubAuth}
                sx={{ py: 1.5 }}
            >
                Githubでログイン
            </Button>
        </Box>
    )
}