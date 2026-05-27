import React, { useEffect, useState } from 'react';
import { Container, Typography, Paper, Box, Stack, TextField, Button, MenuItem, IconButton, Grid, Switch, FormControlLabel, Alert, Divider, InputAdornment } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import api, { errorMessage, fileUrl } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const FALLBACK = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80"><rect fill="%23eee" width="120" height="80"/></svg>';

export default function VendorProducts() {
    const { user } = useAuth();
    const toast = useToast();
    const [products, setProducts] = useState([]);
    const [form, setForm] = useState({
        name: '', description: '', price: '', category: 'fruit',
        stockQuantity: '', unit: 'kg', negotiable: true, minAcceptablePrice: ''
    });
    const [file, setFile] = useState(null);
    const [err, setErr] = useState('');
    const [busy, setBusy] = useState(false);

    const load = async () => {
        try {
            const { data } = await api.get(`/products?vendor=${user._id}`);
            setProducts(data);
        } catch (e) { setErr(errorMessage(e)); }
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { load(); }, []);

    const submit = async (e) => {
        e.preventDefault();
        setErr('');
        if (!form.name || !form.price) return setErr('Name and price are required');
        setBusy(true);
        try {
            const fd = new FormData();
            Object.entries(form).forEach(([k, v]) => { if (v !== '' && v != null) fd.append(k, v); });
            if (file) fd.append('image', file);
            await api.post('/products', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            setForm({ name: '', description: '', price: '', category: 'fruit', stockQuantity: '', unit: 'kg', negotiable: true, minAcceptablePrice: '' });
            setFile(null);
            toast.success('Product added');
            load();
        } catch (e2) {
            setErr(errorMessage(e2));
        } finally { setBusy(false); }
    };

    const del = async (id) => {
        if (!window.confirm('Delete this product?')) return;
        await api.delete(`/products/${id}`);
        load();
    };

    const restock = async (p) => {
        const qty = window.prompt(`How many ${p.unit} of ${p.name} to add?`);
        if (!qty) return;
        try {
            await api.put(`/products/${p._id}`, { stockQuantity: (p.stockQuantity || 0) + parseInt(qty, 10) });
            toast.success(`Restocked. Wishlist customers within 5 km notified.`);
            load();
        } catch (e) { toast.error(errorMessage(e)); }
    };

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Typography variant="h4" gutterBottom>My products</Typography>

            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>Add a new product</Typography>
                {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}
                <Box component="form" onSubmit={submit}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                                <MenuItem value="fruit">Fruit</MenuItem>
                                <MenuItem value="vegetable">Vegetable</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth label="Price" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} />
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <TextField fullWidth select label="Unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
                                {['kg', 'gram', 'piece', 'dozen', 'bunch'].map(u => <MenuItem key={u} value={u}>{u}</MenuItem>)}
                            </TextField>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <TextField fullWidth label="Stock" type="number" value={form.stockQuantity} onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })} />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField fullWidth label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} multiline rows={2} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControlLabel control={<Switch checked={form.negotiable} onChange={(e) => setForm({ ...form, negotiable: e.target.checked })} />} label="Allow haggling" />
                        </Grid>
                        {form.negotiable && (
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth label="Auto-accept if offer ≥ ₹" type="number" value={form.minAcceptablePrice} onChange={(e) => setForm({ ...form, minAcceptablePrice: e.target.value })} helperText="Optional — auto-accept fast deals" />
                            </Grid>
                        )}
                        <Grid item xs={12}>
                            <Stack direction="row" spacing={2} alignItems="center">
                                <Button component="label" variant="outlined" startIcon={<CloudUploadIcon />}>
                                    {file ? file.name : 'Upload image'}
                                    <input hidden type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} />
                                </Button>
                                {file && <Typography variant="caption">{(file.size / 1024).toFixed(0)} KB</Typography>}
                            </Stack>
                        </Grid>
                        <Grid item xs={12}>
                            <Button type="submit" variant="contained" disabled={busy}>{busy ? 'Adding…' : 'Add product'}</Button>
                        </Grid>
                    </Grid>
                </Box>
            </Paper>

            <Typography variant="h6" gutterBottom>Catalog ({products.length})</Typography>
            <Paper>
                {products.length === 0 && (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                        <Typography color="text.secondary">No products yet — add your first one above.</Typography>
                    </Box>
                )}
                {products.map((p, i) => (
                    <Box key={p._id}>
                        <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} spacing={2} sx={{ p: 2 }}>
                            <Box component="img" src={p.image ? fileUrl(p.image) : FALLBACK} alt={p.name} sx={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 1 }} />
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="subtitle1" fontWeight={700}>{p.name}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                    ₹{p.price}/{p.unit} · stock: {p.stockQuantity ?? 0} · sold: {p.salesCount}
                                </Typography>
                            </Box>
                            <Button size="small" variant="outlined" onClick={() => restock(p)}>Restock</Button>
                            <IconButton onClick={() => del(p._id)}><DeleteOutlineIcon /></IconButton>
                        </Stack>
                        {i < products.length - 1 && <Divider />}
                    </Box>
                ))}
            </Paper>
        </Container>
    );
}
