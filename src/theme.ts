'use client'

import { createTheme } from '@mui/material/styles'

const jiroTheme = createTheme({
    palette: {
        primary: {
            main: '#FFC107',
            light: '#FFD54F',
            dark: '#FFA000',
            contrastText: '#212121',
        },
        secondary: {
            main: '#795548',
            light: '#A1887F',
            dark: '#5D4037',
            contrastText: '#FFFFFF',
        },
        error: {
            main: '#D32F2F',
        },
        warning: {
            main: '#FFA000',
        },
        info: {
            main: '#1976D2',
        },
        success: {
            main: '#388E3C',
        },
        background: {
            default: '#F5F5F5',
            paper: '#FFFFFF',
        },
        text: {
            primary: '#212121',
            secondary: '#757575',
        },
    },
    typography: {
        fontFamily: 'var(--font-roboto)',
        h1: {
            fontWeight: 700,
        },
        h2: {
            fontWeight: 700,
        },
        h3: {
            fontWeight: 700,
        },
        h4: {
            fontWeight: 700,
        },
        h5: {
            fontWeight: 700,
        },
        h6: {
            fontWeight: 700,
        },
        button: {
            textTransform: 'none',
            fontWeight: 600,
        },
    },
    shape: {
        borderRadius: 8,
    },
    components: {
        MuiAppBar: {
            styleOverrides: {
                root: {
                    elevation: 0,
                },
            },
        },
        MuiButton: {
            defaultProps: {
                disableElevation: true,
            },
            styleOverrides: {
                root: {
                    padding: '10px 24px',
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    elevation: 1,
                },
            },
        },
    },
})

export default jiroTheme 