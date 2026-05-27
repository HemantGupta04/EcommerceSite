import React, { createContext, useCallback, useContext, useState } from 'react';
import { Snackbar, Alert } from '@mui/material';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
    const [toast, setToast] = useState({ open: false, msg: '', sev: 'info' });

    const show = useCallback((msg, sev = 'info') => {
        setToast({ open: true, msg, sev });
    }, []);

    const value = {
        info: (m) => show(m, 'info'),
        success: (m) => show(m, 'success'),
        warn: (m) => show(m, 'warning'),
        error: (m) => show(m, 'error')
    };

    return (
        <ToastContext.Provider value={value}>
            {children}
            <Snackbar
                open={toast.open}
                autoHideDuration={3500}
                onClose={() => setToast(t => ({ ...t, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert severity={toast.sev} onClose={() => setToast(t => ({ ...t, open: false }))}>
                    {toast.msg}
                </Alert>
            </Snackbar>
        </ToastContext.Provider>
    );
};

export const useToast = () => useContext(ToastContext);
