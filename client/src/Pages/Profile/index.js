import React, { useState } from 'react';
import { Container, Paper, Typography, TextField, Button, Box, Alert, Chip, Stack } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { useAuth } from '../../context/AuthContext';
import { useLocation as useGeo } from '../../context/LocationContext';
import api, { errorMessage } from '../../api';

export default function Profile() {
    const { user, refreshMe } = useAuth();
    const { request } = useGeo();
    const [name, setName] = useState(user?.name || '');
    const [mobile, setMobile] = useState(user?.mobile || '');
    const [loc, setLoc] = useState(user?.location || null);
    const [msg, setMsg] = useState(null);
    const [busy, setBusy] = useState(false);

    const updateLoc = async () => {
        try {
            const c = await request();
            setLoc(c);
        } catch {
            setMsg({ sev: 'error', text: 'Could not get location' });
        }
    };

    const save = async (e) => {
        e.preventDefault();
        setBusy(true);
        setMsg(null);
        try {
            await api.put('/auth/me', { name, mobile, location: loc });
            await refreshMe();
            setMsg({ sev: 'success', text: 'Profile updated' });
        } catch (e2) {
            setMsg({ sev: 'error', text: errorMessage(e2) });
        } finally {
            setBusy(false);
        }
    };

    if (!user) return null;

    return (
        <Container maxWidth="sm" sx={{ py: 6 }}>
            <Paper sx={{ p: 4 }}>
                <Typography variant="h4" gutterBottom>My Profile</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    {user.email} · {user.role}
                </Typography>
                {msg && <Alert severity={msg.sev} sx={{ mb: 2 }}>{msg.text}</Alert>}
                <Box component="form" onSubmit={save} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
                    <TextField label="Mobile" value={mobile} onChange={(e) => setMobile(e.target.value)} required />
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Button variant="outlined" startIcon={<LocationOnIcon />} onClick={updateLoc}>
                            Update my location
                        </Button>
                        {loc && <Chip color="success" size="small" label={`${loc.lat?.toFixed(3)}, ${loc.lng?.toFixed(3)}`} />}
                    </Stack>
                    <Button type="submit" variant="contained" disabled={busy}>
                        {busy ? 'Saving…' : 'Save changes'}
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
}
