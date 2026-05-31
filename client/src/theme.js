import { createTheme } from '@mui/material/styles';

// Indian-natural palette:
// • leaf green (primary) — freshness
// • saffron / marigold (secondary) — warmth, tradition
// • terracotta accent — earthy
// • cream / haldi background — soft & inviting
const palette = {
    leaf: '#1f6f43',
    leafDark: '#155235',
    leafLight: '#3d9c6b',
    saffron: '#ef6c1a',
    saffronDeep: '#c75100',
    marigold: '#f6b93b',
    terracotta: '#b14a2a',
    cream: '#fdf7ec',
    paper: '#ffffff',
    mint: '#e9f4ec',
    paprika: '#7a2e0e',
    text: '#2b2a26',
    muted: '#6b6a64'
};

export const theme = createTheme({
    palette: {
        primary: { main: palette.leaf, dark: palette.leafDark, light: palette.leafLight, contrastText: '#fff' },
        secondary: { main: palette.saffron, dark: palette.saffronDeep, light: palette.marigold, contrastText: '#fff' },
        warning: { main: palette.marigold },
        success: { main: palette.leafLight },
        error: { main: '#c62828' },
        background: { default: palette.cream, paper: palette.paper },
        text: { primary: palette.text, secondary: palette.muted },
        divider: 'rgba(31,111,67,0.12)'
    },
    shape: { borderRadius: 14 },
    typography: {
        fontFamily: '"Plus Jakarta Sans","Inter","Segoe UI",Roboto,sans-serif',
        h1: { fontWeight: 800, letterSpacing: -0.5 },
        h2: { fontWeight: 800, letterSpacing: -0.5 },
        h3: { fontWeight: 800 },
        h4: { fontWeight: 800 },
        h5: { fontWeight: 700 },
        h6: { fontWeight: 700 },
        button: { textTransform: 'none', fontWeight: 600 }
    },
    components: {
        MuiAppBar: {
            styleOverrides: {
                root: {
                    background: 'linear-gradient(95deg, #155235 0%, #1f6f43 60%, #3d9c6b 100%)',
                    boxShadow: '0 6px 18px rgba(21,82,53,0.18)'
                }
            }
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                    boxShadow: '0 4px 18px rgba(28, 65, 38, 0.06)'
                },
                rounded: { borderRadius: 16 }
            }
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 18,
                    overflow: 'hidden',
                    transition: 'transform 0.18s ease, box-shadow 0.18s ease',
                    '&:hover': {
                        transform: 'translateY(-3px)',
                        boxShadow: '0 14px 30px rgba(21,82,53,0.16)'
                    }
                }
            }
        },
        MuiButton: {
            styleOverrides: {
                root: { borderRadius: 12, paddingInline: 18 },
                containedPrimary: {
                    background: 'linear-gradient(135deg, #1f6f43, #3d9c6b)',
                    boxShadow: '0 6px 16px rgba(31,111,67,0.28)',
                    '&:hover': { background: 'linear-gradient(135deg, #155235, #1f6f43)' }
                },
                containedSecondary: {
                    background: 'linear-gradient(135deg, #ef6c1a, #f6b93b)',
                    boxShadow: '0 6px 16px rgba(239,108,26,0.28)',
                    '&:hover': { background: 'linear-gradient(135deg, #c75100, #ef6c1a)' }
                }
            }
        },
        MuiChip: {
            styleOverrides: {
                root: { fontWeight: 600 },
                colorPrimary: { background: 'rgba(31,111,67,0.12)', color: '#155235' },
                colorSecondary: { background: 'rgba(239,108,26,0.14)', color: '#7a2e0e' }
            }
        },
        MuiTextField: {
            defaultProps: { variant: 'outlined' },
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': { borderRadius: 12, background: '#fffdf7' },
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(31,111,67,0.22)' }
                }
            }
        },
        MuiAlert: {
            styleOverrides: { root: { borderRadius: 12 } }
        }
    }
});

export const brandColors = palette;
