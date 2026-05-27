import React, { useEffect, useState } from 'react';
import { Container, Typography, Box, Paper, Grid, Stack, Alert } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PaidIcon from '@mui/icons-material/Paid';
import GroupIcon from '@mui/icons-material/Group';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import api, { errorMessage } from '../../api';
import { useAuth } from '../../context/AuthContext';

const StatCard = ({ icon, label, value, color }) => (
    <Paper sx={{ p: 3, height: '100%' }}>
        <Stack direction="row" spacing={2} alignItems="center">
            <Box sx={{ bgcolor: color, color: 'white', p: 1.5, borderRadius: 2, display: 'flex' }}>{icon}</Box>
            <Box>
                <Typography variant="caption" color="text.secondary">{label}</Typography>
                <Typography variant="h5" fontWeight={700}>{value}</Typography>
            </Box>
        </Stack>
    </Paper>
);

export default function VendorDashboard() {
    const { user } = useAuth();
    const [data, setData] = useState(null);
    const [err, setErr] = useState('');

    useEffect(() => {
        (async () => {
            try {
                const res = await api.get('/vendor/insights?days=30');
                setData(res.data);
            } catch (e) {
                setErr(errorMessage(e));
            }
        })();
    }, []);

    if (err) return <Container sx={{ py: 4 }}><Alert severity="error">{err}</Alert></Container>;
    if (!data) return <Container sx={{ py: 4 }}><Typography>Loading…</Typography></Container>;

    const s = data.summary;
    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Typography variant="h4">Hello, {user?.name?.split(' ')[0]}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Last 30 days at a glance</Typography>

            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6} md={3}><StatCard icon={<PaidIcon />} label="Revenue" value={`₹${s.revenue.toFixed(0)}`} color="primary.main" /></Grid>
                <Grid item xs={6} md={3}><StatCard icon={<TrendingUpIcon />} label="Orders" value={s.orders} color="secondary.main" /></Grid>
                <Grid item xs={6} md={3}><StatCard icon={<LocalShippingIcon />} label="Delivered" value={`${s.delivered} (${s.deliveryRate}%)`} color="success.main" /></Grid>
                <Grid item xs={6} md={3}><StatCard icon={<GroupIcon />} label="AOV" value={`₹${s.avgOrderValue}`} color="info.main" /></Grid>
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
                                <Line type="monotone" dataKey="revenue" stroke="#2e7d32" strokeWidth={2} dot />
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
                                <YAxis dataKey="name" type="category" width={90} />
                                <Tooltip />
                                <Bar dataKey="revenue" fill="#f57c00" />
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
            </Grid>
        </Container>
    );
}
