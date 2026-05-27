import React, { useEffect, useState } from 'react';
import { Container, Typography, Paper, Stack, Box, Button, Divider, Alert, TextField, Chip } from '@mui/material';
import OrderStatusChip from '../../Components/OrderStatusChip';
import api, { errorMessage } from '../../api';
import { useToast } from '../../context/ToastContext';

export default function VendorOrders() {
    const toast = useToast();
    const [orders, setOrders] = useState([]);
    const [err, setErr] = useState('');
    const [otpInput, setOtpInput] = useState({});

    const load = async () => {
        try {
            const { data } = await api.get('/orders/vendor');
            setOrders(data);
        } catch (e) { setErr(errorMessage(e)); }
    };

    useEffect(() => { load(); const t = setInterval(load, 10000); return () => clearInterval(t); }, []);

    const setStatus = async (id, status) => {
        try {
            await api.put(`/orders/${id}/status`, { status });
            toast.success(`Order ${status.replace('_', ' ')}`);
            load();
        } catch (e) { toast.error(errorMessage(e)); }
    };

    const deliver = async (id) => {
        const otp = otpInput[id];
        if (!otp) return toast.warn('Enter the OTP from the customer');
        try {
            await api.post(`/orders/${id}/deliver`, { otp });
            toast.success('Delivered! Cashback credited to customer.');
            load();
        } catch (e) { toast.error(errorMessage(e)); }
    };

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Typography variant="h4" gutterBottom>Incoming orders</Typography>
            {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}
            {orders.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                    <Typography color="text.secondary">No orders yet.</Typography>
                </Box>
            )}
            <Stack spacing={2}>
                {orders.map(o => (
                    <Paper key={o._id} sx={{ p: 3 }}>
                        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'center' }}>
                            <Box>
                                <Typography variant="subtitle1" fontWeight={700}>
                                    Order #{o._id.slice(-6).toUpperCase()}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {new Date(o.createdAt).toLocaleString()} · {o.customer?.name} ({o.customerMobile})
                                </Typography>
                            </Box>
                            <Stack direction="row" alignItems="center" spacing={1}>
                                <Chip size="small" label={`${o.distanceKm} km away`} />
                                <OrderStatusChip status={o.status} />
                            </Stack>
                        </Stack>
                        <Divider sx={{ my: 2 }} />
                        <Stack spacing={0.5} sx={{ mb: 2 }}>
                            {o.items.map((it, i) => (
                                <Stack key={i} direction="row" justifyContent="space-between">
                                    <Typography variant="body2">{it.quantity} × {it.name}</Typography>
                                    <Typography variant="body2">₹{((it.negotiatedPrice ?? it.price) * it.quantity).toFixed(0)}</Typography>
                                </Stack>
                            ))}
                        </Stack>
                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                                {o.walletApplied > 0 ? `Wallet: −₹${o.walletApplied}` : ''}
                            </Typography>
                            <Typography variant="subtitle1" fontWeight={700}>₹{o.total.toFixed(2)}</Typography>
                        </Stack>

                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                            {o.status === 'pending' && (
                                <>
                                    <Button variant="contained" color="success" onClick={() => setStatus(o._id, 'accepted')}>Accept</Button>
                                    <Button variant="text" color="error" onClick={() => setStatus(o._id, 'cancelled')}>Decline</Button>
                                </>
                            )}
                            {o.status === 'accepted' && (
                                <Button variant="contained" onClick={() => setStatus(o._id, 'out_for_delivery')}>Out for delivery</Button>
                            )}
                            {o.status === 'out_for_delivery' && (
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <TextField
                                        size="small"
                                        label="Customer OTP"
                                        value={otpInput[o._id] || ''}
                                        onChange={(e) => setOtpInput({ ...otpInput, [o._id]: e.target.value })}
                                    />
                                    <Button variant="contained" color="success" onClick={() => deliver(o._id)}>Mark delivered</Button>
                                </Stack>
                            )}
                            <Button size="small" href={`tel:${o.customerMobile}`}>Call</Button>
                            <Button size="small" href={`https://www.google.com/maps/dir/?api=1&destination=${o.customerLocation.lat},${o.customerLocation.lng}`} target="_blank" rel="noopener">Directions</Button>
                        </Stack>
                    </Paper>
                ))}
            </Stack>
        </Container>
    );
}
