import React, { useEffect, useState } from 'react';
import { Container, Typography, Paper, Box, Stack, TextField, Button, MenuItem, IconButton, Grid, Switch, FormControlLabel, Alert, Divider, InputAdornment, Collapse, Chip } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DownloadIcon from '@mui/icons-material/Download';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import api, { errorMessage, fileUrl, API_URL } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const FALLBACK = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80"><rect fill="%23f5e7c3" width="120" height="80"/></svg>';

const blank = () => ({
    name: '', description: '', price: '', category: 'fruit',
    stockQuantity: '', unit: 'kg', negotiable: true, minAcceptablePrice: '',
    pricingEnabled: false, morningPrice: '', eveningPrice: '', startHour: 6, endHour: 20,
    prebookEnabled: false, prebookDiscountPercent: ''
});

export default function VendorProducts() {
    const { user } = useAuth();
    const toast = useToast();
    const [products, setProducts] = useState([]);
    const [form, setForm] = useState(blank());
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
        if (form.pricingEnabled) {
            if (!form.morningPrice || !form.eveningPrice) return setErr('Set morning & evening prices for the freshness scheme');
            if (parseFloat(form.eveningPrice) > parseFloat(form.morningPrice)) return setErr('Evening price should be ≤ morning price');
        }
        setBusy(true);
        try {
            const fd = new FormData();
            const basicKeys = ['name', 'description', 'price', 'category', 'stockQuantity', 'unit', 'negotiable', 'minAcceptablePrice'];
            basicKeys.forEach(k => { if (form[k] !== '' && form[k] != null) fd.append(k, form[k]); });
            fd.append('pricingScheme', JSON.stringify({
                enabled: !!form.pricingEnabled,
                morningPrice: form.morningPrice ? parseFloat(form.morningPrice) : undefined,
                eveningPrice: form.eveningPrice ? parseFloat(form.eveningPrice) : undefined,
                startHour: parseInt(form.startHour, 10),
                endHour: parseInt(form.endHour, 10)
            }));
            fd.append('prebook', JSON.stringify({
                enabled: !!form.prebookEnabled,
                discountPercent: form.prebookDiscountPercent ? parseFloat(form.prebookDiscountPercent) : 0
            }));
            if (file) fd.append('image', file);
            await api.post('/products', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            setForm(blank());
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

    const exportXlsx = () => {
        const token = localStorage.getItem('token');
        const url = `${API_URL}/api/vendor/export/products.xlsx`;
        fetch(url, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.blob())
            .then(b => {
                const a = document.createElement('a');
                a.href = URL.createObjectURL(b);
                a.download = `products-${Date.now()}.xlsx`;
                a.click();
            })
            .catch(() => toast.error('Export failed'));
    };

    const setF = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h4">My products</Typography>
                <Button variant="outlined" startIcon={<DownloadIcon />} onClick={exportXlsx}>Export Excel</Button>
            </Stack>

            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>Add a new product</Typography>
                {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}
                <Box component="form" onSubmit={submit}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth label="Name" value={form.name} onChange={(e) => setF('name', e.target.value)} required />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth select label="Category" value={form.category} onChange={(e) => setF('category', e.target.value)}>
                                <MenuItem value="fruit">Fruit</MenuItem>
                                <MenuItem value="vegetable">Vegetable</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField fullWidth label="Base price (morning fresh rate)" type="number" value={form.price} onChange={(e) => setF('price', e.target.value)} required InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} />
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <TextField fullWidth select label="Unit" value={form.unit} onChange={(e) => setF('unit', e.target.value)}>
                                {['kg', 'gram', 'piece', 'dozen', 'bunch'].map(u => <MenuItem key={u} value={u}>{u}</MenuItem>)}
                            </TextField>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <TextField fullWidth label="Stock" type="number" value={form.stockQuantity} onChange={(e) => setF('stockQuantity', e.target.value)} />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField fullWidth label="Description" value={form.description} onChange={(e) => setF('description', e.target.value)} multiline rows={2} />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <FormControlLabel control={<Switch checked={form.negotiable} onChange={(e) => setF('negotiable', e.target.checked)} />} label="Allow haggling" />
                        </Grid>
                        {form.negotiable && (
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth label="Auto-accept if offer ≥ ₹" type="number" value={form.minAcceptablePrice} onChange={(e) => setF('minAcceptablePrice', e.target.value)} helperText="Optional — auto-accept fast deals" />
                            </Grid>
                        )}

                        <Grid item xs={12}>
                            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'rgba(246,185,59,0.08)' }}>
                                <FormControlLabel
                                    control={<Switch checked={form.pricingEnabled} onChange={(e) => setF('pricingEnabled', e.target.checked)} />}
                                    label={<Stack direction="row" spacing={1} alignItems="center">
                                        <LocalFireDepartmentIcon color="secondary" fontSize="small" />
                                        <Typography fontWeight={600}>Freshness pricing — price drops through the day</Typography>
                                    </Stack>}
                                />
                                <Collapse in={form.pricingEnabled}>
                                    <Grid container spacing={2} sx={{ mt: 0.5 }}>
                                        <Grid item xs={6} sm={3}>
                                            <TextField fullWidth label="Morning ₹" type="number" value={form.morningPrice} onChange={(e) => setF('morningPrice', e.target.value)} />
                                        </Grid>
                                        <Grid item xs={6} sm={3}>
                                            <TextField fullWidth label="Evening ₹" type="number" value={form.eveningPrice} onChange={(e) => setF('eveningPrice', e.target.value)} />
                                        </Grid>
                                        <Grid item xs={6} sm={3}>
                                            <TextField fullWidth label="Start hour (0–23)" type="number" inputProps={{ min: 0, max: 23 }} value={form.startHour} onChange={(e) => setF('startHour', e.target.value)} />
                                        </Grid>
                                        <Grid item xs={6} sm={3}>
                                            <TextField fullWidth label="End hour (0–23)" type="number" inputProps={{ min: 0, max: 23 }} value={form.endHour} onChange={(e) => setF('endHour', e.target.value)} />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Typography variant="caption" color="text.secondary">
                                                Price decays linearly from morning ₹{form.morningPrice || '–'} to evening ₹{form.eveningPrice || '–'} between {form.startHour}:00 and {form.endHour}:00.
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </Collapse>
                            </Paper>
                        </Grid>

                        <Grid item xs={12}>
                            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'rgba(31,111,67,0.08)' }}>
                                <FormControlLabel
                                    control={<Switch checked={form.prebookEnabled} onChange={(e) => setF('prebookEnabled', e.target.checked)} />}
                                    label={<Stack direction="row" spacing={1} alignItems="center">
                                        <EventAvailableIcon color="primary" fontSize="small" />
                                        <Typography fontWeight={600}>Allow pre-booking — free delivery + your extra discount</Typography>
                                    </Stack>}
                                />
                                <Collapse in={form.prebookEnabled}>
                                    <Grid container spacing={2} sx={{ mt: 0.5 }}>
                                        <Grid item xs={6} sm={4}>
                                            <TextField fullWidth label="Pre-book discount %" type="number" inputProps={{ min: 0, max: 50 }} value={form.prebookDiscountPercent} onChange={(e) => setF('prebookDiscountPercent', e.target.value)} />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Typography variant="caption" color="text.secondary">
                                                Pre-booked orders always get free delivery, plus this extra discount on the item price.
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </Collapse>
                            </Paper>
                        </Grid>

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
                                    ₹{p.currentPrice ?? p.price}/{p.unit} · stock: {p.stockQuantity ?? 0} · sold: {p.salesCount}
                                </Typography>
                                <Stack direction="row" spacing={0.5} sx={{ mt: 0.5, flexWrap: 'wrap', gap: 0.5 }}>
                                    {p.pricingScheme?.enabled && <Chip size="small" icon={<LocalFireDepartmentIcon />} label="Freshness pricing" color="secondary" variant="outlined" />}
                                    {p.prebook?.enabled && <Chip size="small" icon={<EventAvailableIcon />} label={`Pre-book ${p.prebook.discountPercent || 0}%`} color="primary" variant="outlined" />}
                                </Stack>
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
