import React, { useEffect, useState } from 'react';
import { Container, Typography, Paper, Stack, Box, Button, Divider, Alert, TextField, Chip, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import OrderStatusChip from '../../Components/OrderStatusChip';
import api, { errorMessage, API_URL } from '../../api';
import { useToast } from '../../context/ToastContext';

export default function VendorOrders() {
    const toast = useToast();
    const [orders, setOrders] = useState([]);
    const [err, setErr] = useState('');
    const [otpInput, setOtpInput] = useState({});
    const [forceDialog, setForceDialog] = useState(null);
    const [forceReason, setForceReason] = useState('');

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

    const forceDeliver = async () => {
        if (!forceReason || forceReason.trim().length < 3) return toast.warn('Reason is required');
        try {
            await api.post(`/orders/${forceDialog}/force-deliver`, { reason: forceReason.trim() });
            toast.success('Order force-completed');
            setForceDialog(null);
            setForceReason('');
            load();
        } catch (e) { toast.error(errorMessage(e)); }
    };

    const exportXlsx = () => {
        const token = localStorage.getItem('token');
        fetch(`${API_URL}/api/vendor/export/orders.xlsx`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.blob())
            .then(b => {
                const a = document.createElement('a');
                a.href = URL.createObjectURL(b);
                a.download = `orders-${Date.now()}.xlsx`;
                a.click();
            })
            .catch(() => toast.error('Export failed'));
    };

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h4">Incoming orders</Typography>
                <Button variant="outlined" startIcon={<DownloadIcon />} onClick={exportXlsx}>Export Excel</Button>
            </Stack>
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
                                    {o.isPrebook && <Chip size="small" icon={<EventAvailableIcon />} label="PRE-BOOK" color="primary" sx={{ ml: 1 }} />}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {new Date(o.createdAt).toLocaleString()} · {o.customer?.name} ({o.customerMobile})
                                </Typography>
                                {o.customerAddress && (
                                    <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
                                        📍 {o.customerAddress}
                                    </Typography>
                                )}
                                {o.isPrebook && o.prebookFor && (
                                    <Typography variant="body2" color="primary" sx={{ mt: 0.25, fontWeight: 600 }}>
                                        Deliver on: {new Date(o.prebookFor).toLocaleString()}
                                    </Typography>
                                )}
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
                                    <Typography variant="body2">₹{((it.negotiatedPrice ?? it.dynamicPrice ?? it.price) * it.quantity).toFixed(0)}</Typography>
                                </Stack>
                            ))}
                        </Stack>
                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">Subtotal</Typography>
                            <Typography variant="caption">₹{o.subtotal?.toFixed(2)}</Typography>
                        </Stack>
                        {o.prebookDiscount > 0 && (
                            <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                                <Typography variant="caption" color="success.main">Pre-book discount</Typography>
                                <Typography variant="caption" color="success.main">−₹{o.prebookDiscount.toFixed(2)}</Typography>
                            </Stack>
                        )}
                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">Delivery fee</Typography>
                            <Typography variant="caption">{o.deliveryFee > 0 ? `₹${o.deliveryFee}` : 'FREE'}</Typography>
                        </Stack>
                        {o.walletApplied > 0 && (
                            <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                                <Typography variant="caption" color="text.secondary">Wallet</Typography>
                                <Typography variant="caption" color="success.main">−₹{o.walletApplied}</Typography>
                            </Stack>
                        )}
                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
                            <Typography variant="subtitle1" fontWeight={700}>Total</Typography>
                            <Typography variant="subtitle1" fontWeight={700}>₹{o.total.toFixed(2)}</Typography>
                        </Stack>

                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} flexWrap="wrap" useFlexGap>
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
                            {(o.status === 'out_for_delivery' || o.status === 'accepted') && (
                                <Button variant="outlined" color="warning" onClick={() => { setForceDialog(o._id); setForceReason(''); }}>
                                    Force complete
                                </Button>
                            )}
                            <Button size="small" href={`tel:${o.customerMobile}`}>Call</Button>
                            <Button size="small" href={`https://www.google.com/maps/dir/?api=1&destination=${o.customerLocation.lat},${o.customerLocation.lng}`} target="_blank" rel="noopener">Directions</Button>
                        </Stack>
                        {o.forceCompleted && (
                            <Alert severity="warning" sx={{ mt: 2 }}>
                                Force-completed by you. Reason: {o.forceCompleteReason}
                            </Alert>
                        )}
                    </Paper>
                ))}
            </Stack>

            <Dialog open={!!forceDialog} onClose={() => setForceDialog(null)} fullWidth maxWidth="xs">
                <DialogTitle>Force complete this order?</DialogTitle>
                <DialogContent>
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        This skips the customer OTP. Use only if the order was actually delivered (e.g. customer unreachable, payment confirmed offline).
                    </Alert>
                    <TextField
                        fullWidth autoFocus
                        label="Reason"
                        placeholder="e.g. Customer confirmed by call but lost OTP"
                        value={forceReason}
                        onChange={(e) => setForceReason(e.target.value)}
                        multiline minRows={2}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setForceDialog(null)}>Cancel</Button>
                    <Button variant="contained" color="warning" onClick={forceDeliver}>Force complete</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}
