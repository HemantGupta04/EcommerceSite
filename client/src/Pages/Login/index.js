import React, { useState } from 'react';
import { Container, Paper, Typography, TextField, Button, Box, Alert, Link as MuiLink } from '@mui/material';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { errorMessage } from '../../api';

export default function Login() {
    const { login } = useAuth();
    const nav = useNavigate();
    const loc = useLocation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [err, setErr] = useState('');
    const [busy, setBusy] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setErr('');
        setBusy(true);
        try {
            const u = await login(email, password);
            const dest = loc.state?.from?.pathname || (u.role === 'vendor' ? '/vendor' : '/');
            nav(dest, { replace: true });
        } catch (e2) {
            setErr(errorMessage(e2));
        } finally {
            setBusy(false);
        }
    };

    return (
        <Container maxWidth="sm" sx={{ py: 6 }}>
            <Paper sx={{ p: 4 }}>
                <Typography variant="h4" align="center" gutterBottom>Welcome back</Typography>
                <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
                    Sign in to your TrustMandi account
                </Typography>
                {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}
                <Box component="form" onSubmit={submit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
                    <TextField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    <Button type="submit" variant="contained" size="large" disabled={busy}>
                        {busy ? 'Signing in…' : 'Sign In'}
                    </Button>
                </Box>
                <Typography variant="body2" align="center" sx={{ mt: 3 }}>
                    New here? <MuiLink component={Link} to="/signup">Create an account</MuiLink>
                </Typography>
            </Paper>
        </Container>
    );
}
