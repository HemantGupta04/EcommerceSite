import React, { useEffect, useState, useCallback } from 'react';
import { Container, Grid, Typography, Box, TextField, MenuItem, InputAdornment, Alert, Button, Skeleton, Chip, Slider, Stack } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';
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
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: { md: 'center' }, flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                <Box>
                    <Typography variant="h4">Fresh & local</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Hand-picked fruits & veggies from vendors near you
                    </Typography>
                </Box>
                {!coords && (
                    <Button variant="outlined" startIcon={<LocationOnIcon />} onClick={request}>
                        {denied ? 'Allow location' : 'Use my location'}
                    </Button>
                )}
                {coords && (
                    <Chip color="success" icon={<LocationOnIcon />} label={`Within ${radius} km`} />
                )}
            </Box>

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }}>
                <TextField
                    placeholder="Search fruits & veggies"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
                    fullWidth
                />
                <TextField select label="Category" value={category} onChange={(e) => setCategory(e.target.value)} sx={{ minWidth: 180 }}>
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="fruit">Fruits</MenuItem>
                    <MenuItem value="vegetable">Vegetables</MenuItem>
                </TextField>
                {coords && (
                    <Box sx={{ minWidth: 180, px: 2 }}>
                        <Typography variant="caption" color="text.secondary">Radius: {radius} km</Typography>
                        <Slider min={1} max={5} step={0.5} value={radius} onChange={(_, v) => setRadius(v)} />
                    </Box>
                )}
            </Stack>

            {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}
            {!coords && (
                <Alert severity="info" sx={{ mb: 2 }}>
                    Share your location to see only vendors within 5 km — that's how we keep produce fresh.
                </Alert>
            )}

            <Grid container spacing={2}>
                {loading && [...Array(8)].map((_, i) => (
                    <Grid item xs={6} sm={4} md={3} key={i}>
                        <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
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
    );
}
