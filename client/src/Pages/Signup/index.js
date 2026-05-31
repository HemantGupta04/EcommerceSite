import React, { useState } from 'react';
import { Container, Paper, Typography, TextField, Button, Box, Alert, MenuItem, Chip, Stack } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SpaIcon from '@mui/icons-material/Spa';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLocation as useGeo } from '../../context/LocationContext';
import { errorMessage } from '../../api';

export default function Signup() {
    const { signup } = useAuth();
    const { coords, request } = useGeo();
    const nav = useNavigate();

    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        mobile: '',
        address: '',
        role: 'customer'
    });
    const [err, setErr] = useState('');
    const [busy, setBusy] = useState(false);
    const [loc, setLoc] = useState(coords);

    const handle = (k) => (e) => setForm({ ...form, [k]: e.target.value });

    const useMyLoc = async () => {
        try {
            const c = await request();
            setLoc(c);
        } catch (e2) {
            setErr('Could not get location. Please allow location access.');
        }
    };

    const submit = async (e) => {
        e.preventDefault();
        setErr('');
        if (form.password.length < 8) return setErr('Password must be at least 8 characters');
        if (!form.address || form.address.trim().length < 10) {
            return setErr('Please enter a full delivery address (house no., street, landmark, area)');
        }
        if (!loc) return setErr('We need your location to find vendors within 5 km');
        setBusy(true);
        try {
            const u = await signup({ ...form, address: form.address.trim(), location: loc });
            nav(u.role === 'vendor' ? '/vendor' : '/', { replace: true });
        } catch (e2) {
            setErr(errorMessage(e2));
        } finally {
            setBusy(false);
        }
    };

    return (
        <Box sx={{ py: 6, minHeight: 'calc(100vh - 64px)',
            background: 'radial-gradient(circle at 0% 0%, rgba(246,185,59,0.18), transparent 40%), radial-gradient(circle at 100% 100%, rgba(31,111,67,0.18), transparent 45%)' }}>
            <Container maxWidth="sm">
                <Paper sx={{ p: 4 }}>
                    <Stack direction="row" alignItems="center" spacing={1} justifyContent="center" sx={{ mb: 1 }}>
                        <SpaIcon color="primary" />
                        <Typography variant="h4" align="center">Join TrustMandi</Typography>
                    </Stack>
                    <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
                        Fresh, hand-picked produce from vendors within 5 km
                    </Typography>
                    {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}
                    <Box component="form" onSubmit={submit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField select label="I am a…" value={form.role} onChange={handle('role')}>
                            <MenuItem value="customer">Customer (buy fresh produce)</MenuItem>
                            <MenuItem value="vendor">Vendor (sell my produce)</MenuItem>
                        </TextField>
                        <TextField label="Full Name" value={form.name} onChange={handle('name')} required />
                        <TextField label="Email" type="email" value={form.email} onChange={handle('email')} required />
                        <TextField label="Password" type="password" value={form.password} onChange={handle('password')} helperText="Min 8 characters" required />
                        <TextField label="Mobile" value={form.mobile} onChange={handle('mobile')} placeholder="10-digit phone" required />
                        <TextField
                            label={form.role === 'vendor' ? 'Shop / pickup address' : 'Full delivery address'}
                            value={form.address}
                            onChange={handle('address')}
                            placeholder="House/Shop no., street, landmark, area, city"
                            multiline
                            minRows={2}
                            helperText="Hand-written address helps the vendor reach the right doorstep"
                            required
                        />

                        <Stack direction="row" spacing={1} alignItems="center">
                            <Button variant="outlined" startIcon={<LocationOnIcon />} onClick={useMyLoc}>
                                {loc ? 'Update location' : 'Use my location'}
                            </Button>
                            {loc && <Chip color="success" size="small" label={`${loc.lat.toFixed(3)}, ${loc.lng.toFixed(3)}`} />}
                        </Stack>

                        <Button type="submit" variant="contained" size="large" disabled={busy}>
                            {busy ? 'Creating account…' : 'Create account'}
                        </Button>
                    </Box>
                    <Typography variant="body2" align="center" sx={{ mt: 3 }}>
                        Already have an account? <Link to="/login">Sign in</Link>
                    </Typography>
                </Paper>
            </Container>
        </Box>
    );
}
