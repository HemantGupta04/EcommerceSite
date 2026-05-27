import React, { useEffect, useState } from 'react';
import { Container, Paper, Typography, Box, Stack, TextField, Button, IconButton, Alert, Divider } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import api, { errorMessage } from '../../api';
import { useToast } from '../../context/ToastContext';

export default function Wishlist() {
    const [items, setItems] = useState([]);
    const [name, setName] = useState('');
    const [err, setErr] = useState('');
    const toast = useToast();

    const load = async () => {
        try {
            const { data } = await api.get('/wishlist');
            setItems(data);
        } catch (e) {
            setErr(errorMessage(e));
        }
    };

    useEffect(() => { load(); }, []);

    const add = async () => {
        if (!name.trim()) return;
        try {
            await api.post('/wishlist', { productName: name.trim() });
            setName('');
            load();
            toast.success('Added — we’ll alert you when a vendor near you lists it');
        } catch (e) {
            setErr(errorMessage(e));
        }
    };

    const remove = async (id) => {
        await api.delete(`/wishlist/${id}`);
        load();
    };

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Typography variant="h4" gutterBottom>Wishlist</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Add fruits or vegetables you want — we'll notify you the moment a vendor within 5 km lists or restocks them.
            </Typography>
            {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Stack direction="row" spacing={2}>
                    <TextField fullWidth placeholder="e.g. mango, spinach, papaya" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} />
                    <Button variant="contained" onClick={add}>Add</Button>
                </Stack>
            </Paper>
            <Paper>
                {items.length === 0 && (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">Your wishlist is empty.</Typography>
                    </Box>
                )}
                {items.map((it, i) => (
                    <Box key={it._id}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 2 }}>
                            <Box>
                                <Typography variant="subtitle1" textTransform="capitalize">{it.productName}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {it.notifiedAt ? `Last notified: ${new Date(it.notifiedAt).toLocaleString()}` : 'Watching for vendors near you…'}
                                </Typography>
                            </Box>
                            <IconButton onClick={() => remove(it._id)}><DeleteOutlineIcon /></IconButton>
                        </Stack>
                        {i < items.length - 1 && <Divider />}
                    </Box>
                ))}
            </Paper>
        </Container>
    );
}
