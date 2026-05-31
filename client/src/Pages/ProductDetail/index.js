import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Grid, Typography, Box, Button, Chip, Paper, Alert, TextField, Stack, Divider, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import HandshakeIcon from '@mui/icons-material/Handshake';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import StorefrontIcon from '@mui/icons-material/Storefront';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import api, { errorMessage, fileUrl } from '../../api';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import HaggleDialog from '../../Components/HaggleDialog';

const FALLBACK = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect fill="%23f5e7c3" width="600" height="400"/><text x="50%" y="50%" font-family="Arial" font-size="22" fill="%23a07c2c" dominant-baseline="middle" text-anchor="middle">Fresh produce</text></svg>';

export default function ProductDetail() {
    const { id } = useParams();
    const nav = useNavigate();
    const { user } = useAuth();
    const { add } = useCart();
    const toast = useToast();

    const [product, setProduct] = useState(null);
    const [qty, setQty] = useState(1);
    const [err, setErr] = useState('');
    const [haggleOpen, setHaggleOpen] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const { data } = await api.get(`/products/${id}`);
                setProduct(data);
            } catch (e) {
                setErr(errorMessage(e));
            }
        })();
    }, [id]);

    const addToCart = () => {
        if (!user) return nav('/login');
        if (user.role !== 'customer') return toast.warn('Switch to a customer account to buy');
        add(product, qty);
        toast.success('Added to cart');
    };

    const buyAtNegotiatedPrice = (negotiation) => {
        if (!product) return;
        add(product, negotiation.agreedQuantity, negotiation);
        toast.success('Added at your negotiated price');
        nav('/cart');
    };

    const addToWishlist = async () => {
        if (!user) return nav('/login');
        try {
            await api.post('/wishlist', { productName: product.name });
            toast.success(`Wishlisted ${product.name}`);
        } catch (e) {
            toast.error(errorMessage(e));
        }
    };

    if (err) return <Container sx={{ py: 4 }}><Alert severity="error">{err}</Alert></Container>;
    if (!product) return <Container sx={{ py: 4 }}><Typography>Loading…</Typography></Container>;

    const img = product.image ? fileUrl(product.image) : FALLBACK;
    const outOfStock = product.stockQuantity === 0;
    const dynPrice = product.currentPrice ?? product.price;
    const showsDecay = product.pricingScheme?.enabled && dynPrice < product.price;
    const ps = product.pricingScheme;

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ overflow: 'hidden' }}>
                        <Box component="img" src={img} alt={product.name} sx={{ width: '100%', height: 400, objectFit: 'cover' }} />
                    </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: 'wrap', gap: 1 }}>
                        <Chip label={product.category} color={product.category === 'fruit' ? 'secondary' : 'primary'} />
                        {product.negotiable && <Chip label="Negotiable" color="warning" />}
                        {product.prebook?.enabled && (
                            <Chip icon={<EventAvailableIcon />} color="primary" variant="outlined"
                                label={product.prebook.discountPercent ? `Pre-book −${product.prebook.discountPercent}% + free delivery` : 'Pre-book'} />
                        )}
                        {product.freshness && <Chip label={`${product.freshness.emoji} ${product.freshness.label}`} variant="outlined" />}
                        {outOfStock && <Chip label="Out of stock" />}
                    </Stack>
                    <Typography variant="h4">{product.name}</Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>{product.description}</Typography>

                    <Stack direction="row" alignItems="baseline" spacing={1.5} sx={{ mt: 2 }}>
                        <Typography variant="h3" color="primary.dark" sx={{ fontWeight: 800 }}>
                            ₹{dynPrice}<Typography component="span" variant="h6" color="text.secondary">/{product.unit || 'kg'}</Typography>
                        </Typography>
                        {showsDecay && (
                            <Typography variant="h6" sx={{ textDecoration: 'line-through' }} color="text.secondary">
                                ₹{product.price}
                            </Typography>
                        )}
                    </Stack>
                    {ps?.enabled && (
                        <Alert severity="info" icon={false} sx={{ mt: 1.5, bgcolor: 'rgba(246,185,59,0.12)' }}>
                            <Typography variant="body2">
                                <b>Morning fresh</b>: ₹{ps.morningPrice} → <b>evening price</b>: ₹{ps.eveningPrice} ({ps.startHour}:00 – {ps.endHour}:00). Price refreshes through the day.
                            </Typography>
                        </Alert>
                    )}

                    <Divider sx={{ my: 2 }} />

                    {product.vendor && (
                        <Box sx={{ mb: 2 }}>
                            <Stack direction="row" spacing={1} alignItems="center">
                                <StorefrontIcon fontSize="small" />
                                <Typography variant="body2">{product.vendor.vendorSettings?.shopName || product.vendor.name}</Typography>
                            </Stack>
                            {product.vendor.location && (
                                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                                    <LocationOnIcon fontSize="small" />
                                    <Typography variant="body2" color="text.secondary">
                                        {product.vendor.location.lat?.toFixed(3)}, {product.vendor.location.lng?.toFixed(3)}
                                    </Typography>
                                </Stack>
                            )}
                        </Box>
                    )}

                    {product.stockQuantity > 0 && (
                        <Typography variant="caption" color="success.main">
                            {product.stockQuantity} {product.unit} available
                        </Typography>
                    )}

                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 3 }}>
                        <Typography variant="body2">Qty:</Typography>
                        <IconButton size="small" onClick={() => setQty(q => Math.max(1, q - 1))}><RemoveIcon /></IconButton>
                        <TextField size="small" value={qty} onChange={(e) => setQty(Math.max(1, parseInt(e.target.value, 10) || 1))} sx={{ width: 70 }} inputProps={{ style: { textAlign: 'center' } }} />
                        <IconButton size="small" onClick={() => setQty(q => q + 1)}><AddIcon /></IconButton>
                        <Typography variant="body2" color="text.secondary">{product.unit}</Typography>
                    </Stack>

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 3 }}>
                        <Button variant="contained" size="large" disabled={outOfStock} onClick={addToCart}>
                            Add to cart · ₹{(dynPrice * qty).toFixed(0)}
                        </Button>
                        {product.negotiable && !outOfStock && (
                            <Button variant="outlined" size="large" startIcon={<HandshakeIcon />} onClick={() => setHaggleOpen(true)}>
                                Make an offer
                            </Button>
                        )}
                        <Button variant="text" startIcon={<FavoriteBorderIcon />} onClick={addToWishlist}>
                            Wishlist
                        </Button>
                    </Stack>
                </Grid>
            </Grid>
            <HaggleDialog open={haggleOpen} onClose={() => setHaggleOpen(false)} product={product} onAccepted={buyAtNegotiatedPrice} />
        </Container>
    );
}
