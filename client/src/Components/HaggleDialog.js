import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Typography, Box, Alert, InputAdornment } from '@mui/material';
import api, { errorMessage } from '../api';
import { useToast } from '../context/ToastContext';

export default function HaggleDialog({ open, onClose, product, onAccepted }) {
    const [price, setPrice] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [note, setNote] = useState('');
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState('');
    const toast = useToast();

    const submit = async () => {
        setErr('');
        const p = parseFloat(price);
        const q = parseFloat(quantity);
        if (!p || p <= 0) return setErr('Enter a valid price');
        if (!q || q <= 0) return setErr('Enter a valid quantity');
        if (p >= product.price) return setErr(`Your offer must be below ₹${product.price}/${product.unit}`);
        setBusy(true);
        try {
            const { data } = await api.post('/negotiations', {
                productId: product._id,
                proposedPrice: p,
                quantity: q,
                note
            });
            if (data.status === 'accepted') {
                toast.success(`Deal locked at ₹${data.agreedPrice}/${product.unit}!`);
                onAccepted?.(data);
            } else {
                toast.info('Offer sent. Vendor will respond shortly.');
            }
            onClose();
        } catch (e) {
            setErr(errorMessage(e));
        } finally {
            setBusy(false);
        }
    };

    if (!product) return null;

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
            <DialogTitle>Haggle on {product.name}</DialogTitle>
            <DialogContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Vendor's listed price: <b>₹{product.price}/{product.unit}</b>. Offer a fair price — they'll accept, counter, or reject within 6 hours.
                </Typography>
                {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    <TextField
                        label="Your offer per unit"
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment>, endAdornment: <InputAdornment position="end">/{product.unit}</InputAdornment> }}
                    />
                    <TextField
                        label={`Quantity (${product.unit})`}
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                    />
                    <TextField
                        label="Note (optional)"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="bulk order / regular customer"
                        multiline
                        rows={2}
                    />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={submit} variant="contained" disabled={busy}>{busy ? 'Sending…' : 'Send offer'}</Button>
            </DialogActions>
        </Dialog>
    );
}
