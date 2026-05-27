import React, { useEffect, useState } from 'react';
import { Container, Paper, Typography, TextField, Button, Box, Alert, Stack, Divider, FormControlLabel, Switch, Chip } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { useNavigate } from 'react-router-dom';
import api, { errorMessage } from '../../api';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useLocation as useGeo } from '../../context/LocationContext';
import { useToast } from '../../context/ToastContext';

export default function Checkout() {
    const { items, total, clear } = useCart();
    const { user } = useAuth();
    const { coords, request } = useGeo();
    const toast = useToast();
    const nav = useNavigate();

    const [mobile, setMobile] = useState(user?.mobile || '');
    const [loc, setLoc] = useState(coords || user?.location || null);
    const [walletBalance, setWalletBalance] = useState(0);
    const [useWallet, setUseWallet] = useState(false);
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState('');

    useEffect(() => {
        (async () => {
            try {
                const { data } = await api.get('/wallet');
                setWalletBalance(data.balance || 0);
            } catch { /* ignore */ }
        })();
    }, []);

    const useMyLoc = async () => {
        try { setLoc(await request()); }
        catch { setErr('Location access denied'); }
    };

    const walletApplied = useWallet ? Math.min(walletBalance, total) : 0;
    const payable = total - walletApplied;

    const placeOrder = async () => {
        setErr('');
        if (!mobile) return setErr('Mobile number required');
        if (items.length === 0) return setErr('Cart is empty');
        const effectiveLoc = loc || { lat: 28.6139, lng: 77.2090 };

        const negotiationId = items.find(i => i.negotiationId)?.negotiationId;

        setBusy(true);
        try {
            const { data } = await api.post('/orders', {
                items: items.map(i => ({ product: i.productId, quantity: i.quantity })),
                customerMobile: mobile,
                customerLocation: effectiveLoc,
                useWallet,
                negotiationId
            });
            clear();
            toast.success('Order placed!');
            if (data.whatsappLink) {
                window.open(data.whatsappLink, '_blank', 'noopener');
            }
            nav('/orders');
        } catch (e) {
            setErr(errorMessage(e));
        } finally {
            setBusy(false);
        }
    };

    if (items.length === 0) {
        return (
            <Container sx={{ py: 8, textAlign: 'center' }}>
                <Typography>Your cart is empty.</Typography>
            </Container>
        );
    }

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Typography variant="h4" gutterBottom>Checkout</Typography>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
                <Paper sx={{ flex: 1, p: 3 }}>
                    <Typography variant="h6" gutterBottom>Delivery details</Typography>
                    {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}
                    <Stack spacing={2}>
                        <TextField label="Mobile" value={mobile} onChange={(e) => setMobile(e.target.value)} fullWidth required />
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Button variant="outlined" startIcon={<LocationOnIcon />} onClick={useMyLoc}>
                                {loc ? 'Update' : 'Use my location'}
                            </Button>
                            {loc && <Chip color="success" size="small" label={`${loc.lat?.toFixed(3)}, ${loc.lng?.toFixed(3)}`} />}
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                            Location is optional right now — a default will be used for testing.
                        </Typography>
                    </Stack>

                    <Divider sx={{ my: 3 }} />
                    <Typography variant="h6" gutterBottom>Payment</Typography>
                    <Alert severity="info" sx={{ mb: 2 }}>
                        Cash on Delivery for v1. Online payment coming soon (Razorpay).
                    </Alert>
                    <FormControlLabel
                        control={<Switch checked={useWallet} onChange={(e) => setUseWallet(e.target.checked)} disabled={walletBalance <= 0} />}
                        label={`Use wallet balance (₹${walletBalance.toFixed(2)} available)`}
                    />
                </Paper>

                <Paper sx={{ width: { xs: '100%', md: 320 }, p: 3, alignSelf: 'flex-start' }}>
                    <Typography variant="h6" gutterBottom>Order summary</Typography>
                    {items.map(i => (
                        <Box key={i.productId} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="body2">{i.quantity} × {i.name}</Typography>
                            <Typography variant="body2">₹{(i.price * i.quantity).toFixed(0)}</Typography>
                        </Box>
                    ))}
                    <Divider sx={{ my: 1.5 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Subtotal</Typography>
                        <Typography variant="body2">₹{total.toFixed(2)}</Typography>
                    </Box>
                    {walletApplied > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="success.main">Wallet</Typography>
                            <Typography variant="body2" color="success.main">−₹{walletApplied.toFixed(2)}</Typography>
                        </Box>
                    )}
                    <Divider sx={{ my: 1.5 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="subtitle1" fontWeight={700}>Pay on delivery</Typography>
                        <Typography variant="subtitle1" fontWeight={700}>₹{payable.toFixed(2)}</Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                        You'll earn 2% cashback when delivered.
                    </Typography>
                    <Button fullWidth variant="contained" size="large" onClick={placeOrder} disabled={busy}>
                        {busy ? 'Placing…' : 'Place order'}
                    </Button>
                </Paper>
            </Stack>
        </Container>
    );
}
