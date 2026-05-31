import React, { useEffect, useState, useCallback } from 'react';
import { Container, Grid, Typography, Box, TextField, MenuItem, InputAdornment, Alert, Button, Skeleton, Chip, Slider, Stack, Paper } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SpaIcon from '@mui/icons-material/Spa';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';
import api, { errorMessage } from '../../api';
import { useLocation as useGeo } from '../../context/LocationContext';
import ProductCard from '../../Components/ProductCard';

export default function Browse() {
    const { coords, request, denied } = useGeo();
    const [products, setProducts] = useState([]);
    const [q, setQ] = useState('');
    const [category, setCategory] = useState('');
    const [radius, setRadius] = useState(5);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        setErr('');
        try {
            const params = {};
            if (q) params.q = q;
            if (category) params.category = category;
            if (coords?.lat) {
                params.lat = coords.lat;
                params.lng = coords.lng;
                params.radius = radius;
            }
            const { data } = await api.get('/products', { params });
            setProducts(data);
        } catch (e) {
            setErr(errorMessage(e));
        } finally {
            setLoading(false);
        }
    }, [q, category, radius, coords]);

    useEffect(() => { load(); }, [load]);

    return (
        <>
            <Box sx={{
                py: { xs: 4, md: 6 },
                background: 'linear-gradient(125deg, rgba(31,111,67,0.92) 0%, rgba(61,156,107,0.92) 55%, rgba(246,185,59,0.85) 100%)',
                color: '#fff',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <Box sx={{
                    position: 'absolute', inset: 0,
                    backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(255,255,255,0.10), transparent 30%), radial-gradient(circle at 90% 80%, rgba(255,255,255,0.10), transparent 30%)',
                    pointerEvents: 'none'
                }} />
                <Container maxWidth="lg" sx={{ position: 'relative' }}>
                    <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ md: 'center' }} justifyContent="space-between" spacing={2}>
                        <Box>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                                <SpaIcon sx={{ fontSize: 32 }} />
                                <Typography variant="overline" sx={{ letterSpacing: 2, fontWeight: 700 }}>TrustMandi</Typography>
                            </Stack>
                            <Typography variant="h3" sx={{ fontWeight: 800, lineHeight: 1.05 }}>
                                Fresh from the mandi,<br />delivered with love.
                            </Typography>
                            <Typography variant="body1" sx={{ mt: 1.5, opacity: 0.95, maxWidth: 520 }}>
                                Hand-picked fruits and vegetables from vendors within 5 km. Pay only for what's juicy.
                            </Typography>
                        </Box>
                        {!coords ? (
                            <Button size="large" variant="contained" color="secondary" startIcon={<LocationOnIcon />} onClick={request}>
                                {denied ? 'Allow location' : 'Use my location'}
                            </Button>
                        ) : (
                            <Chip color="secondary" icon={<LocalFloristIcon />} label={`Within ${radius} km of you`} sx={{ fontWeight: 700 }} />
                        )}
                    </Stack>
                </Container>
            </Box>

            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Paper sx={{ p: 2, mb: 3, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                    <TextField
                        placeholder="Search fruits & veggies"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
                        sx={{ flex: '1 1 240px' }}
                    />
                    <TextField select label="Category" value={category} onChange={(e) => setCategory(e.target.value)} sx={{ minWidth: 180 }}>
                        <MenuItem value="">All</MenuItem>
                        <MenuItem value="fruit">Fruits</MenuItem>
                        <MenuItem value="vegetable">Vegetables</MenuItem>
                    </TextField>
                    {coords && (
                        <Box sx={{ minWidth: 200, px: 2 }}>
                            <Typography variant="caption" color="text.secondary">Radius: {radius} km</Typography>
                            <Slider min={1} max={5} step={0.5} value={radius} onChange={(_, v) => setRadius(v)} />
                        </Box>
                    )}
                </Paper>

                {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}
                {!coords && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                        Share your location to see only vendors within 5 km — that's how we keep produce fresh.
                    </Alert>
                )}

                <Grid container spacing={2.5}>
                    {loading && [...Array(8)].map((_, i) => (
                        <Grid item xs={6} sm={4} md={3} key={i}>
                            <Skeleton variant="rectangular" height={320} sx={{ borderRadius: 3 }} />
                        </Grid>
                    ))}
                    {!loading && products.length === 0 && (
                        <Grid item xs={12}>
                            <Box sx={{ textAlign: 'center', py: 8 }}>
                                <Typography variant="h6">No produce found</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Try a wider radius or different search.
                                </Typography>
                            </Box>
                        </Grid>
                    )}
                    {!loading && products.map((p) => (
                        <Grid item xs={6} sm={4} md={3} key={p._id}>
                            <ProductCard product={p} />
                        </Grid>
                    ))}
                </Grid>
            </Container>
        </>
    );
}
