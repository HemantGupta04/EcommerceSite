import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ role, children }) {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
                <CircularProgress />
            </Box>
        );
    }
    if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
    if (role && user.role !== role) return <Navigate to="/" replace />;
    return children;
}
