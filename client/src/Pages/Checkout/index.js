import React, { useEffect, useMemo, useState } from 'react';
import { Container, Paper, Typography, TextField, Button, Box, Alert, Stack, Divider, FormControlLabel, Switch, Chip } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import { useNavigate } from 'react-router-dom';
import api, { errorMessage } from '../../api';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useLocation as useGeo } from '../../context/LocationContext';
import { useToast } from '../../context/ToastContext';

const DEFAULT_FEE = 20;
const DEFAULT_CAP = 200;

export default function Checkout() {
    const { items, total, clear } = useCart();
    const { user } = useAuth();
    const { coords, request } = useGeo();
    const toast = useToast();
    const nav = useNavigate();

    const [mobile, setMobile] = useState(user?.mobile || '');
    const [address, setAddress] = useState(user?.address || '');
    const [loc, setLoc] = useState(coords || user?.location || null);
    const [walletBalance, setWalletBalance] = useState(0);
    const [useWallet, setUseWallet] = useState(false);
    const [isPrebook, setIsPrebook] = useState(false);
    const [prebookFor, setPrebookFor] = useState('');
    const [vendorSettings, setVendorSettings] = useState(null);
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState('');

    const vendorId = items[0]?.vendor;
    const prebookAllowed = items.length > 0 && items.every(i => i.prebookEnabled);
    const prebookSavings = useMemo(() => {
        if (!isPrebook || !prebookAllowed) return 0;
        return items.reduce((s, i) => s + (i.price * i.quantity) * ((i.prebookDiscountPercent || 0) / 100), 0);
    }, [isPrebook, prebookAllowed, items]);

    const subtotalAfterPrebook = +(total - prebookSavings).toFixed(2);
    const freeCap = vendorSettings?.freeDeliveryCap ?? DEFAULT_CAP;
    const baseFee = vendorSettings?.deliveryFee ?? DEFAULT_FEE;
    const prebookFreeThreshold = freeCap / 2;
    const prebookQualifiesForFree = isPrebook && subtotalAfterPrebook >= prebookFreeThreshold;
    const deliveryFee = prebookQualifiesForFree
        ? 0
        : (subtotalAfterPrebook >= freeCap ? 0 : baseFee);

    const prebookMinDateTime = useMemo(() => {
        const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const pad = (n) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }, []);
    const payableBeforeWallet = +(subtotalAfterPrebook + deliveryFee).toFixed(2);
    const walletApplied = useWallet ? Math.min(walletBalance, payableBeforeWallet) : 0;
    const payable = +(payableBeforeWallet - walletApplied).toFixed(2);

    useEffect(() => {
        (async () => {
            try {
                const { data } = await api.get('/wallet');
                setWalletBalance(data.balance || 0);
            } catch { /* ignore */ }
        })();
    }, []);

    useEffect(() => {
        if (!vendorId) return;
        (async () => {
            try {
                const { data } = await api.get(`/products?vendor=${vendorId}`);
                const v = data[0]?.vendor;
                if (v?.vendorSettings) setVendorSettings(v.vendorSettings);
            } catch { /* ignore */ }
        })();
    }, [vendorId]);

    const useMyLoc = async () => {
        try { setLoc(await request()); }
        catch { setErr('Location access denied'); }
    };

    const placeOrder = async () => {
        setErr('');
        if (!mobile) return setErr('Mobile number required');
        if (!address || address.trim().length < 10) return setErr('Please enter a full delivery address');
        if (!loc) return setErr('Location required');
        if (items.length === 0) return setErr('Cart is empty');
        if (isPrebook && !prebookFor) return setErr('Pick a pre-book date & time');
        if (isPrebook && new Date(prebookFor).getTime() - Date.now() < 24 * 60 * 60 * 1000) {
            return setErr('Pre-book must be at least 1 day in advance');
        }

        const negotiationId = items.find(i => i.negotiationId)?.negotiationId;

        setBusy(true);
        try {
            const { data } = await api.post('/orders', {
                items: items.map(i => ({ product: i.productId, quantity: i.quantity })),
                customerMobile: mobile,
                customerAddress: address.trim(),
                customerLocation: loc,
                useWallet,
                negotiationId,
                isPrebook,
                prebookFor: isPrebook ? prebookFor : undefined
            });
            clear();
            toast.success(isPrebook ? 'Pre-booked!' : 'Order placed!');
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
                        <TextField
                            label="Full delivery address"
                            placeholder="House no., street, landmark, area, city"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            multiline
                            minRows={3}
                            helperText="Hand-written address helps the vendor reach the right doorstep"
                            fullWidth required
                        />
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Button variant="outlined" startIcon={<LocationOnIcon />} onClick={useMyLoc}>
                                {loc ? 'Update GPS' : 'Use my location'}
                            </Button>
                            {loc && <Chip color="success" size="small" label={`${loc.lat?.toFixed(3)}, ${loc.lng?.toFixed(3)}`} />}
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                            Note: vendor must be within 5 km of your location.
                        </Typography>
                    </Stack>

                    <Divider sx={{ my: 3 }} />
                    <Typography variant="h6" gutterBottom>Pre-book (optional)</Typography>
                    {prebookAllowed ? (
                        <>
                            <FormControlLabel
                                control={<Switch checked={isPrebook} onChange={(e) => setIsPrebook(e.target.checked)} />}
                                label={<Stack direction="row" spacing={1} alignItems="center">
                                    <EventAvailableIcon fontSize="small" /><span>Pre-book this order (extra discount + free delivery on ₹{prebookFreeThreshold.toFixed(0)}+)</span>
                                </Stack>}
                            />
                            {isPrebook && (
                                <>
                                    <TextField
                                        type="datetime-local"
                                        label="Deliver on"
                                        value={prebookFor}
                                        onChange={(e) => setPrebookFor(e.target.value)}
                                        InputLabelProps={{ shrink: true }}
                                        inputProps={{ min: prebookMinDateTime }}
                                        helperText="Must be at least 1 day from now"
                                        sx={{ mt: 1.5, maxWidth: 280 }}
                                    />
                                    {!prebookQualifiesForFree && (
                                        <Alert severity="info" sx={{ mt: 1.5 }}>
                                            Add ₹{(prebookFreeThreshold - subtotalAfterPrebook).toFixed(0)} more to unlock free delivery on pre-book.
                                        </Alert>
                                    )}
                                </>
                            )}
                        </>
                    ) : (
                        <Alert severity="info" sx={{ mt: 1 }} icon={<EventAvailableIcon />}>
                            Pre-booking is not available for one or more items in your cart.
                        </Alert>
                    )}

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

                <Paper sx={{ width: { xs: '100%', md: 340 }, p: 3, alignSelf: 'flex-start' }}>
                    <Typography variant="h6" gutterBottom>Order summary</Typography>
                    {items.map(i => (
                        <Box key={i.productId} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="body2">{i.quantity} × {i.name}</Typography>
                            <Typography variant="body2">₹{(i.price * i.quantity).toFixed(0)}</Typography>
                        </Box>
                    ))}
                    <Divider sx={{ my: 1.5 }} />
                    <Row label="Subtotal" value={`₹${total.toFixed(2)}`} />
                    {prebookSavings > 0 && <Row label="Pre-book discount" value={`−₹${prebookSavings.toFixed(2)}`} color="success.main" />}
                    <Row
                        label={<Stack direction="row" spacing={0.5} alignItems="center"><LocalShippingIcon fontSize="inherit" /><span>Delivery</span></Stack>}
                        value={deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                        color={deliveryFee === 0 ? 'success.main' : 'text.primary'}
                    />
                    {deliveryFee > 0 && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                            Add ₹{(freeCap - subtotalAfterPrebook).toFixed(0)} more for free delivery
                        </Typography>
                    )}
                    {walletApplied > 0 && <Row label="Wallet" value={`−₹${walletApplied.toFixed(2)}`} color="success.main" />}
                    <Divider sx={{ my: 1.5 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="subtitle1" fontWeight={700}>Pay on delivery</Typography>
                        <Typography variant="subtitle1" fontWeight={700}>₹{payable.toFixed(2)}</Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                        You'll earn 2% cashback when delivered.
                    </Typography>
                    <Button fullWidth variant="contained" size="large" onClick={placeOrder} disabled={busy}>
                        {busy ? 'Placing…' : (isPrebook ? 'Confirm pre-book' : 'Place order')}
                    </Button>
                </Paper>
            </Stack>
        </Container>
    );
}

function Row({ label, value, color }) {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="body2" sx={{ color: color || 'text.primary' }}>{label}</Typography>
            <Typography variant="body2" sx={{ color: color || 'text.primary' }}>{value}</Typography>
        </Box>
    );
}
