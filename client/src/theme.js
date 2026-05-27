import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
    palette: {
        primary: { main: '#2e7d32' },
        secondary: { main: '#f57c00' },
        background: { default: '#fafaf7' }
    },
    shape: { borderRadius: 12 },
    typography: {
        fontFamily: '"Inter","Segoe UI",Roboto,sans-serif',
        h4: { fontWeight: 700 },
        h5: { fontWeight: 700 },
        h6: { fontWeight: 600 }
    }
});
