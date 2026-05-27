import React, { useEffect, useState } from 'react';
import { Container, Typography, Paper, Stack, Box, Chip, Button, TextField, Alert, Divider } from '@mui/material';
import api, { errorMessage } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { useNavigate } from 'react-router-dom';

const STATUS_COLOR = { open: 'info', accepted: 'success', rejected: 'error', expired: 'default' };

export default function Negotiations() {
    const { user } = useAuth();
    const { add } = useCart();
    const toast = useToast();
    const nav = useNavigate();
    const [items, setItems] = useState([]);
    const [err, setErr] = useState('');
    const [counter, setCounter] = useState({});

    const load = async () => {
        try {
            const { data } = await api.get('/negotiations/mine');
            setItems(data);
        } catch (e) { setErr(errorMessage(e)); }
    };

    useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t); }, []);

    const act = async (id, action, body = {}) => {
        try {
            await api.post(`/negotiations/${id}/${action}`, body);
            toast.success(`Offer ${action}ed`);
            load();
        } catch (e) {
            toast.error(errorMessage(e));
        }
    };

    const buy = (neg) => {
        const product = neg.product;
        add({ ...product, vendor: { _id: neg.vendor._id, name: neg.vendor.name } }, neg.agreedQuantity, neg);
        toast.success('Added to cart at negotiated price');
        nav('/cart');
    };

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Typography variant="h4" gutterBottom>Haggles</Typography>
            {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}
            {items.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                        No active negotiations. Find a product and tap “Make an offer”.
                    </Typography>
                </Box>
            )}
            <Stack spacing={2}>
                {items.map(n => {
                    const last = n.offers[n.offers.length - 1];
                    const isVendor = user.role === 'vendor';
                    const myTurn = (isVendor && last.by === 'customer') || (!isVendor && last.by === 'vendor');
                    return (
                        <Paper key={n._id} sx={{ p: 3 }}>
                            <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'center' }}>
                                <Box>
                                    <Typography variant="subtitle1" fontWeight={700}>{n.product.name}</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {isVendor ? `Customer: ${n.customer.name}` : `Vendor: ${n.vendor.name}`} · listed ₹{n.product.price}/{n.product.unit}
                                    </Typography>
                                </Box>
                                <Chip color={STATUS_COLOR[n.status]} label={n.status} />
                            </Stack>
                            <Divider sx={{ my: 2 }} />
                            <Stack spacing={1} sx={{ mb: 2 }}>
                                {n.offers.map((o, i) => (
                                    <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2">
                                            <b>{o.by}</b>: ₹{o.price}/{n.product.unit} × {o.quantity}{o.note ? ` — ${o.note}` : ''}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">{new Date(o.at).toLocaleString()}</Typography>
                                    </Box>
                                ))}
                            </Stack>

                            {n.status === 'open' && myTurn && (
                                <Box>
                                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="center" sx={{ mb: 1 }}>
                                        <TextField
                                            size="small"
                                            label="Counter ₹"
                                            type="number"
                                            value={counter[n._id]?.price || ''}
                                            onChange={(e) => setCounter({ ...counter, [n._id]: { ...counter[n._id], price: e.target.value } })}
                                        />
                                        <TextField
                                            size="small"
                                            label={`Qty (${n.product.unit})`}
                                            type="number"
                                            value={counter[n._id]?.quantity || last.quantity}
                                            onChange={(e) => setCounter({ ...counter, [n._id]: { ...counter[n._id], quantity: e.target.value } })}
                                        />
                                        <Button
                                            variant="outlined"
                                            disabled={!counter[n._id]?.price}
                                            onClick={() => act(n._id, 'counter', {
                                                price: parseFloat(counter[n._id].price),
                                                quantity: parseFloat(counter[n._id].quantity || last.quantity)
                                            })}
                                        >Counter</Button>
                                    </Stack>
                                    <Stack direction="row" spacing={1}>
                                        <Button variant="contained" color="success" onClick={() => act(n._id, 'accept')}>Accept ₹{last.price}/{n.product.unit}</Button>
                                        <Button variant="text" color="error" onClick={() => act(n._id, 'reject')}>Reject</Button>
                                    </Stack>
                                </Box>
                            )}
                            {n.status === 'accepted' && !isVendor && (
                                <Button variant="contained" onClick={() => buy(n)}>Buy at ₹{n.agreedPrice}/{n.product.unit}</Button>
                            )}
                        </Paper>
                    );
                })}
            </Stack>
        </Container>
    );
}
