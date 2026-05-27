import React from 'react';
import { Chip } from '@mui/material';

const MAP = {
    pending: { label: 'Pending', color: 'default' },
    accepted: { label: 'Accepted', color: 'info' },
    out_for_delivery: { label: 'Out for delivery', color: 'warning' },
    delivered: { label: 'Delivered', color: 'success' },
    cancelled: { label: 'Cancelled', color: 'error' }
};

export default function OrderStatusChip({ status, size = 'small' }) {
    const cfg = MAP[status] || { label: status, color: 'default' };
    return <Chip size={size} label={cfg.label} color={cfg.color} />;
}
