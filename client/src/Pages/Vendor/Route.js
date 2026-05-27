import React, { useEffect, useState } from 'react';
import { Container, Typography, Paper, Box, Stack, Button, Alert, Chip, Divider } from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import RouteIcon from '@mui/icons-material/Route';
import api, { errorMessage } from '../../api';

export default function VendorRoute() {
    const [plan, setPlan] = useState(null);
    const [err, setErr] = useState('');
    const [loading, setLoading] = useState(true);

    const load = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/vendor/route');
            setPlan(data);
        } catch (e) { setErr(errorMessage(e)); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Typography variant="h4" gutterBottom>Optimized delivery route</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                We pick the shortest order across all your active orders so you make fewer trips.
            </Typography>

            {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}
            {!loading && plan && plan.stops?.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                    <Typography color="text.secondary">No accepted or out-for-delivery orders right now.</Typography>
                </Box>
            )}
            {plan && plan.stops?.length > 0 && (
                <Paper sx={{ p: 3 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                        <Box>
                            <Stack direction="row" spacing={1} alignItems="center">
                                <RouteIcon />
                                <Typography variant="h6">{plan.stops.length} stops</Typography>
                            </Stack>
                            <Typography variant="caption" color="text.secondary">
                                Total {plan.totalKm} km · ETA ≈ {plan.etaMinutes} min @ 20 km/h
                            </Typography>
                        </Box>
                        <Button variant="contained" startIcon={<OpenInNewIcon />} href={plan.mapsLink} target="_blank" rel="noopener">
                            Open in Maps
                        </Button>
                    </Stack>
                    <Divider />
                    <Stack divider={<Divider />}>
                        {plan.stops.map(s => (
                            <Stack key={s.orderId} direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 1.5 }}>
                                <Box>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <Chip size="small" label={`#${s.seq}`} color="primary" />
                                        <Typography variant="subtitle1">{s.customer || 'Customer'}</Typography>
                                    </Stack>
                                    <Typography variant="caption" color="text.secondary">
                                        {s.mobile} · ₹{s.total} · leg {s.legKm} km
                                    </Typography>
                                </Box>
                                <Button size="small" href={`tel:${s.mobile}`}>Call</Button>
                            </Stack>
                        ))}
                    </Stack>
                </Paper>
            )}
        </Container>
    );
}
