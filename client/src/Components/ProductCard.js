import React from 'react';
import { Card, CardActionArea, CardMedia, CardContent, Typography, Chip, Box } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import StorefrontIcon from '@mui/icons-material/Storefront';
import { Link } from 'react-router-dom';
import { fileUrl } from '../api';

const FALLBACK = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="240" height="160"><rect fill="%23eee" width="240" height="160"/><text x="50%" y="50%" font-family="Arial" font-size="14" fill="%23999" dominant-baseline="middle" text-anchor="middle">No image</text></svg>';

export default function ProductCard({ product }) {
    const img = product.image ? fileUrl(product.image) : FALLBACK;
    const outOfStock = product.stockQuantity === 0;

    return (
        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardActionArea component={Link} to={`/products/${product._id}`} sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
                <CardMedia component="img" image={img} alt={product.name} sx={{ height: 160, objectFit: 'cover' }} />
                <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                        <Typography variant="h6" sx={{ lineHeight: 1.2 }}>{product.name}</Typography>
                        <Chip size="small" label={product.category} color={product.category === 'fruit' ? 'secondary' : 'primary'} variant="outlined" />
                    </Box>
                    <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
                        ₹{product.price}<Typography component="span" variant="body2" color="text.secondary">/{product.unit || 'kg'}</Typography>
                    </Typography>
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
                    {product.negotiable && <Chip size="small" label="Negotiable" color="warning" sx={{ mt: 1, mr: 1 }} />}
                    {outOfStock && <Chip size="small" label="Out of stock" color="default" sx={{ mt: 1 }} />}
                </CardContent>
            </CardActionArea>
        </Card>
    );
}
