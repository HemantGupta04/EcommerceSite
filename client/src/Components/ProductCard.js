import React from 'react';
import { Card, CardActionArea, CardMedia, CardContent, Typography, Chip, Box, Stack, Tooltip } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import StorefrontIcon from '@mui/icons-material/Storefront';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import { Link } from 'react-router-dom';
import { fileUrl } from '../api';

const FALLBACK = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="240" height="160"><rect fill="%23f5e7c3" width="240" height="160"/><text x="50%" y="50%" font-family="Arial" font-size="14" fill="%23a07c2c" dominant-baseline="middle" text-anchor="middle">Fresh produce</text></svg>';

export default function ProductCard({ product }) {
    const img = product.image ? fileUrl(product.image) : FALLBACK;
    const outOfStock = product.stockQuantity === 0;
    const dynPrice = product.currentPrice ?? product.price;
    const isDiscounted = product.pricingScheme?.enabled && dynPrice < product.price;

    return (
        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardActionArea component={Link} to={`/products/${product._id}`} sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
                <Box sx={{ position: 'relative' }}>
                    <CardMedia component="img" image={img} alt={product.name} sx={{ height: 170, objectFit: 'cover' }} />
                    {product.freshness && (
                        <Chip
                            size="small"
                            label={`${product.freshness.emoji} ${product.freshness.label}`}
                            sx={{
                                position: 'absolute', top: 10, left: 10,
                                bgcolor: 'rgba(255,255,255,0.92)',
                                color: 'primary.dark', fontWeight: 600, backdropFilter: 'blur(4px)'
                            }}
                        />
                    )}
                    {isDiscounted && (
                        <Tooltip title="Price drops through the day">
                            <Chip
                                size="small"
                                icon={<LocalFireDepartmentIcon fontSize="small" />}
                                label="Today's price"
                                sx={{
                                    position: 'absolute', top: 10, right: 10,
                                    bgcolor: 'secondary.main', color: 'white', fontWeight: 700
                                }}
                            />
                        </Tooltip>
                    )}
                </Box>
                <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                        <Typography variant="h6" sx={{ lineHeight: 1.2 }}>{product.name}</Typography>
                        <Chip size="small" label={product.category} color={product.category === 'fruit' ? 'secondary' : 'primary'} variant="outlined" />
                    </Box>
                    <Stack direction="row" alignItems="baseline" spacing={1}>
                        <Typography variant="h6" color="primary.dark" sx={{ fontWeight: 800 }}>
                            ₹{dynPrice}<Typography component="span" variant="body2" color="text.secondary">/{product.unit || 'kg'}</Typography>
                        </Typography>
                        {isDiscounted && (
                            <Typography variant="caption" sx={{ textDecoration: 'line-through' }} color="text.secondary">
                                ₹{product.price}
                            </Typography>
                        )}
                    </Stack>
                    {product.vendor?.name && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                            <StorefrontIcon fontSize="inherit" />
                            <Typography variant="caption" color="text.secondary">{product.vendor.name}</Typography>
                        </Box>
                    )}
                    {product.distanceKm != null && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <LocationOnIcon fontSize="inherit" />
                            <Typography variant="caption" color="text.secondary">{product.distanceKm.toFixed(1)} km away</Typography>
                        </Box>
                    )}
                    <Stack direction="row" spacing={0.5} sx={{ mt: 1, flexWrap: 'wrap', gap: 0.5 }}>
                        {product.negotiable && <Chip size="small" label="Negotiable" color="warning" />}
                        {product.prebook?.enabled && (
                            <Chip size="small" icon={<EventAvailableIcon />}
                                label={product.prebook.discountPercent ? `Pre-book −${product.prebook.discountPercent}%` : 'Pre-book'}
                                sx={{ bgcolor: 'rgba(31,111,67,0.12)', color: 'primary.dark' }}
                            />
                        )}
                        {outOfStock && <Chip size="small" label="Out of stock" color="default" />}
                    </Stack>
                </CardContent>
            </CardActionArea>
        </Card>
    );
}
