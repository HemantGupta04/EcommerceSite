import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, Box, Button, IconButton, Badge, Menu, MenuItem, Avatar, useMediaQuery, Drawer, List, ListItemButton, ListItemText } from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import MenuIcon from '@mui/icons-material/Menu';
import EcoIcon from '@mui/icons-material/Spa';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import NotificationsBell from './NotificationsBell';

export default function Navbar() {
    const { user, logout } = useAuth();
    const { count } = useCart();
    const nav = useNavigate();
    const [profileMenu, setProfileMenu] = useState(null);
    const [drawer, setDrawer] = useState(false);
    const isSmall = useMediaQuery('(max-width:780px)');

    const doLogout = () => {
        logout();
        setProfileMenu(null);
        nav('/');
    };

    const customerLinks = (
        <>
            <Button color="inherit" component={Link} to="/">Browse</Button>
            <Button color="inherit" component={Link} to="/orders">My Orders</Button>
            <Button color="inherit" component={Link} to="/wishlist">Wishlist</Button>
            <Button color="inherit" component={Link} to="/wallet">Wallet</Button>
            <Button color="inherit" component={Link} to="/negotiations">Haggles</Button>
        </>
    );

    const vendorLinks = (
        <>
            <Button color="inherit" component={Link} to="/vendor">Dashboard</Button>
            <Button color="inherit" component={Link} to="/vendor/products">Products</Button>
            <Button color="inherit" component={Link} to="/vendor/orders">Orders</Button>
            <Button color="inherit" component={Link} to="/vendor/route">Route</Button>
            <Button color="inherit" component={Link} to="/vendor/negotiations">Haggles</Button>
        </>
    );

    return (
        <AppBar position="sticky" elevation={1}>
            <Toolbar>
                {isSmall && user && (
                    <IconButton color="inherit" edge="start" onClick={() => setDrawer(true)}>
                        <MenuIcon />
                    </IconButton>
                )}
                <Box component={Link} to="/" sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit', flexGrow: { xs: 1, md: 0 } }}>
                    <EcoIcon sx={{ mr: 1 }} />
                    <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: 0.5 }}>TrustMandi</Typography>
                </Box>

                {!isSmall && (
                    <Box sx={{ ml: 4, flexGrow: 1, display: 'flex', gap: 0.5 }}>
                        {user?.role === 'vendor' ? vendorLinks : customerLinks}
                    </Box>
                )}

                {user ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {user.role === 'customer' && (
                            <IconButton color="inherit" component={Link} to="/cart">
                                <Badge badgeContent={count} color="error">
                                    <ShoppingCartIcon />
                                </Badge>
                            </IconButton>
                        )}
                        <NotificationsBell />
                        <IconButton onClick={(e) => setProfileMenu(e.currentTarget)}>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                                {user.name?.charAt(0).toUpperCase()}
                            </Avatar>
                        </IconButton>
                        <Menu anchorEl={profileMenu} open={!!profileMenu} onClose={() => setProfileMenu(null)}>
                            <MenuItem disabled>
                                <Box>
                                    <Typography variant="body2" fontWeight={700}>{user.name}</Typography>
                                    <Typography variant="caption" color="text.secondary">{user.role}</Typography>
                                </Box>
                            </MenuItem>
                            <MenuItem component={Link} to="/profile" onClick={() => setProfileMenu(null)}>Profile</MenuItem>
                            <MenuItem onClick={doLogout}>Logout</MenuItem>
                        </Menu>
                    </Box>
                ) : (
                    <Box>
                        <Button color="inherit" component={Link} to="/login">Login</Button>
                        <Button variant="contained" color="secondary" component={Link} to="/signup" sx={{ ml: 1 }}>Sign Up</Button>
                    </Box>
                )}
            </Toolbar>

            <Drawer open={drawer} onClose={() => setDrawer(false)}>
                <Box sx={{ width: 260 }} onClick={() => setDrawer(false)}>
                    <List>
                        {user?.role === 'vendor' ? (
                            <>
                                <ListItemButton component={Link} to="/vendor"><ListItemText primary="Dashboard" /></ListItemButton>
                                <ListItemButton component={Link} to="/vendor/products"><ListItemText primary="Products" /></ListItemButton>
                                <ListItemButton component={Link} to="/vendor/orders"><ListItemText primary="Orders" /></ListItemButton>
                                <ListItemButton component={Link} to="/vendor/route"><ListItemText primary="Delivery Route" /></ListItemButton>
                                <ListItemButton component={Link} to="/vendor/negotiations"><ListItemText primary="Haggles" /></ListItemButton>
                            </>
                        ) : (
                            <>
                                <ListItemButton component={Link} to="/"><ListItemText primary="Browse" /></ListItemButton>
                                <ListItemButton component={Link} to="/orders"><ListItemText primary="My Orders" /></ListItemButton>
                                <ListItemButton component={Link} to="/wishlist"><ListItemText primary="Wishlist" /></ListItemButton>
                                <ListItemButton component={Link} to="/wallet"><ListItemText primary="Wallet" /></ListItemButton>
                                <ListItemButton component={Link} to="/negotiations"><ListItemText primary="Haggles" /></ListItemButton>
                            </>
                        )}
                    </List>
                </Box>
            </Drawer>
        </AppBar>
    );
}
