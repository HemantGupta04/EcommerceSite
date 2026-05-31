import React, { useEffect, useState } from 'react';
import { Container, Paper, Typography, Box, IconButton, Button, Stack, Divider, Alert, TextField } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import api, { fileUrl } from '../../api';

const FALLBACK = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect fill="%23f5e7c3" width="80" height="80"/></svg>';

const DEFAULT_FEE = 20;
const DEFAULT_CAP = 200;

export default function Cart() {
    const { items, update, remove, total, multiVendor, vendorIds } = useCart();
    const nav = useNavigate();
    const [vendorSettings, setVendorSettings] = useState(null);

    useEffect(() => {
        if (!vendorIds[0]) return;
        (async () => {
            try {
                const { data } = await api.get(`/products?vendor=${vendorIds[0]}`);
                const v = data[0]?.vendor;
                if (v?.vendorSettings) setVendorSettings(v.vendorSettings);
            } catch { /* ignore */ }
        })();
    }, [vendorIds]);

    const freeCap = vendorSettings?.freeDeliveryCap ?? DEFAULT_CAP;
    const baseFee = vendorSettings?.deliveryFee ?? DEFAULT_FEE;
    const deliveryFee = total >= freeCap ? 0 : baseFee;
    const grand = total + deliveryFee;

    if (items.length === 0) {
        return (
            <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
                <Typography variant="h5">Your cart is empty</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Discover fresh produce near you.</Typography>
                <Button component={Link} to="/" variant="contained" sx={{ mt: 3 }}>Browse</Button>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Typography variant="h4" gutterBottom>Your cart</Typography>
            {multiVendor && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                    Cart has items from multiple vendors. Please remove items so all are from a single vendor.
                </Alert>
            )}
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="flex-start">
                <Paper sx={{ flex: 1, p: 2, width: '100%' }}>
                    {items.map((i) => (
                        <Box key={i.productId} sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2, borderBottom: '1px solid #eee' }}>
                            <Box component="img" src={i.image ? fileUrl(i.image) : FALLBACK} alt={i.name} sx={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 1 }} />
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="subtitle1" fontWeight={700}>{i.name}</Typography>
                                <Typography variant="caption" color="text.secondary">{i.vendorName}</Typography>
                                {i.negotiationId && <Typography variant="caption" color="warning.main" sx={{ display: 'block' }}>Haggled price applied</Typography>}
                                <Typography variant="body2">₹{i.price}/{i.unit}</Typography>
                            </Box>
                            <Stack direction="row" alignItems="center" spacing={1}>
                                <IconButton size="small" onClick={() => update(i.productId, i.quantity - 1)}><RemoveIcon /></IconButton>
                                <TextField size="small" value={i.quantity} onChange={(e) => update(i.productId, Math.max(1, parseInt(e.target.value, 10) || 1))} sx={{ width: 60 }} inputProps={{ style: { textAlign: 'center' } }} />
                                <IconButton size="small" onClick={() => update(i.productId, i.quantity + 1)}><AddIcon /></IconButton>
                            </Stack>
                            <Typography variant="subtitle1" sx={{ width: 80, textAlign: 'right' }}>₹{(i.price * i.quantity).toFixed(0)}</Typography>
                            <IconButton onClick={() => remove(i.productId)}><DeleteOutlineIcon /></IconButton>
                        </Box>
                    ))}
                </Paper>

                <Paper sx={{ width: { xs: '100%', md: 340 }, p: 3, position: { md: 'sticky' }, top: 80 }}>
                    <Typography variant="h6" gutterBottom>Summary</Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Subtotal</Typography>
                        <Typography variant="body2">₹{total.toFixed(2)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                            <LocalShippingIcon fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary">Delivery</Typography>
                        </Stack>
                        <Typography variant="body2" color={deliveryFee === 0 ? 'success.main' : 'text.primary'}>
                            {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                        </Typography>
                    </Box>
                    {deliveryFee > 0 && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                            Add ₹{(freeCap - total).toFixed(0)} more for free delivery
                        </Typography>
                    )}
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="subtitle1" fontWeight={700}>Total</Typography>
                        <Typography variant="subtitle1" fontWeight={700}>₹{grand.toFixed(2)}</Typography>
                    </Box>
                    <Button fullWidth variant="contained" size="large" disabled={multiVendor} onClick={() => nav('/checkout')}>
                        Checkout
                    </Button>
                </Paper>
            </Stack>
        </Container>
    );
}
