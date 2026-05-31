import React, { useEffect, useState } from 'react';
import { Container, Typography, Box, Paper, Stack, Divider, Chip, Alert, Stepper, Step, StepLabel, Button } from '@mui/material';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import api, { errorMessage } from '../../api';
import OrderStatusChip from '../../Components/OrderStatusChip';

const STEPS = ['pending', 'accepted', 'out_for_delivery', 'delivered'];

export default function MyOrders() {
    const [orders, setOrders] = useState([]);
    const [err, setErr] = useState('');
    const [loading, setLoading] = useState(true);

    const load = async () => {
        try {
            const { data } = await api.get('/orders/customer');
            setOrders(data);
        } catch (e) {
            setErr(errorMessage(e));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        const t = setInterval(load, 15000);
        return () => clearInterval(t);
    }, []);

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Typography variant="h4" gutterBottom>My orders</Typography>
            {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}
            {!loading && orders.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                    <Typography>No orders yet.</Typography>
                </Box>
            )}
            <Stack spacing={2}>
                {orders.map(o => {
                    const stepIdx = STEPS.indexOf(o.status);
                    return (
                        <Paper key={o._id} sx={{ p: 3 }}>
                            <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'center' }} spacing={1}>
                                <Box>
                                    <Typography variant="subtitle1" fontWeight={700}>
                                        Order #{o._id.slice(-6).toUpperCase()}
                                        {o.isPrebook && <Chip size="small" icon={<EventAvailableIcon />} label="PRE-BOOK" color="primary" sx={{ ml: 1 }} />}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {new Date(o.createdAt).toLocaleString()} · {o.vendor?.name}
                                    </Typography>
                                    {o.customerAddress && (
                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                            📍 {o.customerAddress}
                                        </Typography>
                                    )}
                                    {o.isPrebook && o.prebookFor && (
                                        <Typography variant="body2" color="primary" sx={{ mt: 0.25, fontWeight: 600 }}>
                                            Pre-book delivery: {new Date(o.prebookFor).toLocaleString()}
                                        </Typography>
                                    )}
                                </Box>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <OrderStatusChip status={o.status} />
                                    {o.status === 'out_for_delivery' && o.deliveryOtp && (
                                        <Chip color="warning" label={`OTP: ${o.deliveryOtp}`} />
                                    )}
                                </Stack>
                            </Stack>

                            <Divider sx={{ my: 2 }} />

                            {o.status !== 'cancelled' && (
                                <Stepper activeStep={stepIdx} alternativeLabel sx={{ mb: 2 }}>
                                    {STEPS.map(s => <Step key={s}><StepLabel>{s.replace('_', ' ')}</StepLabel></Step>)}
                                </Stepper>
                            )}

                            <Stack spacing={0.5}>
                                {o.items.map((it, i) => (
                                    <Stack key={i} direction="row" justifyContent="space-between">
                                        <Typography variant="body2">{it.quantity} × {it.name || it.product?.name}</Typography>
                                        <Typography variant="body2">₹{((it.negotiatedPrice ?? it.price) * it.quantity).toFixed(0)}</Typography>
                                    </Stack>
                                ))}
                            </Stack>

                            <Divider sx={{ my: 2 }} />
                            <Stack spacing={0.4}>
                                <Stack direction="row" justifyContent="space-between">
                                    <Typography variant="caption" color="text.secondary">Subtotal</Typography>
                                    <Typography variant="caption">₹{o.subtotal?.toFixed(2)}</Typography>
                                </Stack>
                                {o.prebookDiscount > 0 && (
                                    <Stack direction="row" justifyContent="space-between">
                                        <Typography variant="caption" color="success.main">Pre-book discount</Typography>
                                        <Typography variant="caption" color="success.main">−₹{o.prebookDiscount.toFixed(2)}</Typography>
                                    </Stack>
                                )}
                                <Stack direction="row" justifyContent="space-between">
                                    <Typography variant="caption" color="text.secondary">Delivery fee</Typography>
                                    <Typography variant="caption">{o.deliveryFee > 0 ? `₹${o.deliveryFee}` : 'FREE'}</Typography>
                                </Stack>
                                {o.walletApplied > 0 && (
                                    <Stack direction="row" justifyContent="space-between">
                                        <Typography variant="caption" color="text.secondary">Wallet</Typography>
                                        <Typography variant="caption" color="success.main">−₹{o.walletApplied}</Typography>
                                    </Stack>
                                )}
                                <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5 }}>
                                    <Typography variant="body2" color="text.secondary">Distance: {o.distanceKm} km</Typography>
                                    <Typography variant="subtitle1" fontWeight={700}>₹{o.total.toFixed(2)}</Typography>
                                </Stack>
                            </Stack>
                            {o.status === 'delivered' && o.cashbackEarned > 0 && (
                                <Alert severity="success" sx={{ mt: 1 }}>
                                    ₹{o.cashbackEarned} cashback credited to your wallet
                                </Alert>
                            )}
                            {o.forceCompleted && (
                                <Alert severity="info" sx={{ mt: 1 }}>
                                    Vendor closed this delivery without OTP. Reason: {o.forceCompleteReason}
                                </Alert>
                            )}
                            {o.vendor?.mobile && o.status !== 'delivered' && o.status !== 'cancelled' && (
                                <Button
                                    size="small"
                                    sx={{ mt: 1 }}
                                    href={`tel:${o.vendor.mobile}`}
                                >Call vendor</Button>
                            )}
                        </Paper>
                    );
                })}
            </Stack>
        </Container>
    );
}
