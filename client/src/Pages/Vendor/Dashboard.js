import React, { useEffect, useState } from 'react';
import { Container, Typography, Box, Paper, Grid, Stack, Alert, Button, TextField, MenuItem, Divider, Chip } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PaidIcon from '@mui/icons-material/Paid';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import RouteIcon from '@mui/icons-material/Route';
import DownloadIcon from '@mui/icons-material/Download';
import SettingsIcon from '@mui/icons-material/Settings';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    LineChart, Line, CartesianGrid, PieChart, Pie, Cell, Legend
} from 'recharts';
import api, { errorMessage, API_URL } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const CATEGORY_COLORS = ['#1f6f43', '#ef6c1a', '#f6b93b', '#b14a2a'];

const StatCard = ({ icon, label, value, color, sub }) => (
    <Paper sx={{ p: { xs: 1.5, sm: 2.5 }, height: '100%' }}>
        <Stack direction="row" spacing={{ xs: 1, sm: 2 }} alignItems="center">
            <Box sx={{ bgcolor: color, color: 'white', p: { xs: 1, sm: 1.4 }, borderRadius: 2, display: 'flex' }}>{icon}</Box>
            <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="caption" color="text.secondary" noWrap display="block">{label}</Typography>
                <Typography fontWeight={800} noWrap sx={{ fontSize: { xs: '1.1rem', sm: '1.5rem' } }}>{value}</Typography>
                {sub && <Typography variant="caption" color="text.secondary" noWrap display="block">{sub}</Typography>}
            </Box>
        </Stack>
    </Paper>
);

export default function VendorDashboard() {
    const { user } = useAuth();
    const toast = useToast();
    const [data, setData] = useState(null);
    const [err, setErr] = useState('');
    const [days, setDays] = useState(30);
    const [settings, setSettings] = useState({ freeDeliveryCap: 200, deliveryFee: 20, shopName: '', tagline: '' });
    const [savingSettings, setSavingSettings] = useState(false);

    const loadInsights = async (d = days) => {
        try {
            const res = await api.get(`/vendor/insights?days=${d}`);
            setData(res.data);
        } catch (e) {
            setErr(errorMessage(e));
        }
    };

    const loadSettings = async () => {
        try {
            const { data: s } = await api.get('/vendor/settings');
            if (s.vendorSettings) setSettings(prev => ({ ...prev, ...s.vendorSettings }));
        } catch { /* ignore */ }
    };

    useEffect(() => { loadInsights(days); }, [days]); // eslint-disable-line
    useEffect(() => { loadSettings(); }, []);

    const saveSettings = async () => {
        setSavingSettings(true);
        try {
            await api.put('/vendor/settings', { vendorSettings: settings });
            toast.success('Settings saved');
        } catch (e) {
            toast.error(errorMessage(e));
        } finally {
            setSavingSettings(false);
        }
    };

    const download = (path, name) => {
        const token = localStorage.getItem('token');
        fetch(`${API_URL}/api/${path}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.blob())
            .then(b => {
                const a = document.createElement('a');
                a.href = URL.createObjectURL(b);
                a.download = name;
                a.click();
            }).catch(() => toast.error('Export failed'));
    };

    if (err) return <Container sx={{ py: 4 }}><Alert severity="error">{err}</Alert></Container>;
    if (!data) return <Container sx={{ py: 4 }}><Typography>Loading…</Typography></Container>;

    const s = data.summary;

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Box sx={{
                p: { xs: 2, sm: 3 }, mb: 3, borderRadius: 3,
                background: 'linear-gradient(120deg, #1f6f43 0%, #3d9c6b 60%, #f6b93b 100%)',
                color: '#fff', boxShadow: '0 12px 28px rgba(31,111,67,0.22)'
            }}>
                <Typography variant="h4" sx={{ fontSize: { xs: '1.6rem', sm: '2.125rem' } }}>Namaste, {user?.name?.split(' ')[0]} 🙏</Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    {settings.tagline || 'Fresh produce, happy customers — let’s grow your mandi today.'}
                </Typography>
            </Box>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }} justifyContent="space-between" sx={{ mb: 2 }}>
                <TextField select size="small" value={days} onChange={(e) => setDays(e.target.value)} label="Window" sx={{ maxWidth: { xs: '100%', sm: 200 } }}>
                    {[7, 14, 30, 60, 90].map(d => <MenuItem key={d} value={d}>Last {d} days</MenuItem>)}
                </TextField>
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1, '& > button': { flex: { xs: 1, sm: '0 0 auto' } } }}>
                    <Button size="small" startIcon={<DownloadIcon />} variant="outlined" onClick={() => download(`vendor/export/insights.xlsx?days=${days}`, `insights-${days}d.xlsx`)}>Insights</Button>
                    <Button size="small" startIcon={<DownloadIcon />} variant="outlined" onClick={() => download('vendor/export/orders.xlsx', `orders.xlsx`)}>Orders</Button>
                    <Button size="small" startIcon={<DownloadIcon />} variant="outlined" onClick={() => download('vendor/export/products.xlsx', `products.xlsx`)}>Products</Button>
                </Stack>
            </Stack>

            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6} md={3}><StatCard icon={<PaidIcon />} label="Revenue" value={`₹${s.revenue.toFixed(0)}`} color="primary.main" sub={`AOV ₹${s.avgOrderValue}`} /></Grid>
                <Grid item xs={6} md={3}><StatCard icon={<TrendingUpIcon />} label="Orders" value={s.orders} color="secondary.main" sub={`${s.deliveryRate}% delivered`} /></Grid>
                <Grid item xs={6} md={3}><StatCard icon={<LocalShippingIcon />} label="Delivery fees" value={`₹${s.deliveryFees}`} color="success.main" sub={`Avg ${s.avgDistanceKm} km`} /></Grid>
                <Grid item xs={6} md={3}><StatCard icon={<EventAvailableIcon />} label="Pre-book share" value={`${s.prebookConversion}%`} color="info.main" sub={`₹${s.prebookRevenue} revenue`} /></Grid>
            </Grid>

            <Grid container spacing={2}>
                <Grid item xs={12} md={7}>
                    <Paper sx={{ p: 3, height: 340 }}>
                        <Typography variant="h6" gutterBottom>Daily revenue trend</Typography>
                        <ResponsiveContainer width="100%" height="85%">
                            <LineChart data={data.dailyTrend}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="_id" />
                                <YAxis />
                                <Tooltip />
                                <Line type="monotone" dataKey="revenue" stroke="#1f6f43" strokeWidth={2.5} dot />
                            </LineChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={5}>
                    <Paper sx={{ p: 3, height: 340 }}>
                        <Typography variant="h6" gutterBottom>Top items by revenue</Typography>
                        <ResponsiveContainer width="100%" height="85%">
                            <BarChart data={data.topItems} layout="vertical">
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={70} tick={{ fontSize: 12 }} />
                                <Tooltip />
                                <Bar dataKey="revenue" fill="#ef6c1a" radius={[0, 6, 6, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={5}>
                    <Paper sx={{ p: 3, height: 320 }}>
                        <Typography variant="h6" gutterBottom>Category split</Typography>
                        {data.categorySplit.length === 0 ? (
                            <Typography variant="body2" color="text.secondary">No data.</Typography>
                        ) : (
                            <ResponsiveContainer width="100%" height="85%">
                                <PieChart>
                                    <Pie dataKey="revenue" data={data.categorySplit} cx="50%" cy="50%" outerRadius={90} label>
                                        {data.categorySplit.map((_, i) => <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </Paper>
                </Grid>

                <Grid item xs={12} md={7}>
                    <Paper sx={{ p: 3, height: 320 }}>
                        <Typography variant="h6" gutterBottom>Hourly revenue (sells through the day)</Typography>
                        <ResponsiveContainer width="100%" height="85%">
                            <BarChart data={data.hourlyRevenue}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="hour" tickFormatter={(h) => `${h}h`} />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="revenue" fill="#f6b93b" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>Peak hours</Typography>
                        {data.peakHours.length === 0 ? (
                            <Typography variant="body2" color="text.secondary">Not enough data yet.</Typography>
                        ) : data.peakHours.map(h => (
                            <Stack key={h.hour} direction="row" justifyContent="space-between" sx={{ py: 0.5 }}>
                                <Typography variant="body2">{h.hour}:00 – {h.hour + 1}:00</Typography>
                                <Typography variant="body2" fontWeight={600}>{h.orders} orders</Typography>
                            </Stack>
                        ))}
                    </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>Repeat customers</Typography>
                        {data.repeatCustomers.length === 0 ? (
                            <Typography variant="body2" color="text.secondary">No repeat customers yet.</Typography>
                        ) : data.repeatCustomers.map((c, i) => (
                            <Stack key={i} direction="row" justifyContent="space-between" sx={{ py: 0.5 }}>
                                <Typography variant="body2">{c.customer}</Typography>
                                <Typography variant="body2">{c.orders} orders · ₹{c.spent.toFixed(0)}</Typography>
                            </Stack>
                        ))}
                    </Paper>
                </Grid>

                {data.cancellations?.length > 0 && (
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>Top cancellation reasons</Typography>
                            {data.cancellations.map((c, i) => (
                                <Stack key={i} direction="row" justifyContent="space-between" sx={{ py: 0.5 }}>
                                    <Typography variant="body2">{c.reason}</Typography>
                                    <Chip size="small" label={`${c.count}`} />
                                </Stack>
                            ))}
                        </Paper>
                    </Grid>
                )}

                <Grid item xs={12} md={data.cancellations?.length > 0 ? 6 : 12}>
                    <Paper sx={{ p: 3 }}>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                            <SettingsIcon color="primary" />
                            <Typography variant="h6">Shop & delivery settings</Typography>
                        </Stack>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth label="Shop name" value={settings.shopName || ''} onChange={(e) => setSettings({ ...settings, shopName: e.target.value })} />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth label="Tagline" value={settings.tagline || ''} onChange={(e) => setSettings({ ...settings, tagline: e.target.value })} placeholder="e.g. Hand-picked at dawn from local farms" />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth type="number" label="Delivery fee (₹)" value={settings.deliveryFee ?? ''} onChange={(e) => setSettings({ ...settings, deliveryFee: e.target.value })} helperText="Charged below the free cap" />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth type="number" label="Free delivery above (₹)" value={settings.freeDeliveryCap ?? ''} onChange={(e) => setSettings({ ...settings, freeDeliveryCap: e.target.value })} helperText="Orders ≥ this amount → free delivery" />
                            </Grid>
                            <Grid item xs={12}>
                                <Button startIcon={<RouteIcon />} variant="contained" disabled={savingSettings} onClick={saveSettings}>
                                    {savingSettings ? 'Saving…' : 'Save settings'}
                                </Button>
                            </Grid>
                        </Grid>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="caption" color="text.secondary">
                            Pre-booked orders must be placed at least 1 day in advance and ship free when the subtotal is ≥ 50% of the free delivery cap.
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
}
