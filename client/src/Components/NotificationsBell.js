import React, { useEffect, useState } from 'react';
import { IconButton, Badge, Menu, MenuItem, Typography, Box, Button, Divider } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const TYPE_ICON = {
    order_new: '🛒',
    order_status: '📦',
    haggle_offer: '💬',
    haggle_accepted: '✅',
    haggle_rejected: '❌',
    restock: '🔔',
    cashback: '💰'
};

export default function NotificationsBell() {
    const [anchor, setAnchor] = useState(null);
    const [items, setItems] = useState([]);
    const [unread, setUnread] = useState(0);
    const nav = useNavigate();

    const load = async () => {
        try {
            const { data } = await api.get('/notifications');
            setItems(data.items || []);
            setUnread(data.unread || 0);
        } catch { /* ignore */ }
    };

    useEffect(() => {
        load();
        const t = setInterval(load, 15000);
        return () => clearInterval(t);
    }, []);

    const onClick = async (n) => {
        try { await api.put(`/notifications/${n._id}/read`); } catch { /* ignore */ }
        setAnchor(null);
        if (n.data?.orderId) nav('/orders');
        else if (n.data?.negotiationId) nav('/negotiations');
        else if (n.data?.productId) nav(`/products/${n.data.productId}`);
    };

    const markAll = async () => {
        await api.put('/notifications/read-all');
        load();
    };

    return (
        <>
            <IconButton color="inherit" onClick={(e) => setAnchor(e.currentTarget)}>
                <Badge badgeContent={unread} color="error">
                    <NotificationsIcon />
                </Badge>
            </IconButton>
            <Menu
                anchorEl={anchor}
                open={!!anchor}
                onClose={() => setAnchor(null)}
                PaperProps={{ sx: { width: 360, maxHeight: 480 } }}
            >
                <Box sx={{ px: 2, py: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle1" fontWeight={700}>Notifications</Typography>
                    {unread > 0 && <Button size="small" onClick={markAll}>Mark all read</Button>}
                </Box>
                <Divider />
                {items.length === 0 && (
                    <MenuItem disabled>
                        <Typography variant="body2">You're all caught up</Typography>
                    </MenuItem>
                )}
                {items.map((n) => (
                    <MenuItem key={n._id} onClick={() => onClick(n)} sx={{ alignItems: 'flex-start', whiteSpace: 'normal', py: 1.2 }}>
                        <Box sx={{ width: '100%' }}>
                            <Typography variant="body2" fontWeight={n.read ? 400 : 700}>
                                {TYPE_ICON[n.type] || '🔔'} {n.title}
                            </Typography>
                            {n.body && <Typography variant="caption" color="text.secondary">{n.body}</Typography>}
                        </Box>
                    </MenuItem>
                ))}
            </Menu>
        </>
    );
}
