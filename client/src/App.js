import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import Navbar from './Components/navbar';
import ProtectedRoute from './Components/ProtectedRoute';
import { useAuth } from './context/AuthContext';

import Browse from './Pages/Browse';
import ProductDetail from './Pages/ProductDetail';
import Cart from './Pages/Cart';
import Checkout from './Pages/Checkout';
import Login from './Pages/Login';
import Signup from './Pages/Signup';
import Profile from './Pages/Profile';

import MyOrders from './Pages/MyOrders';
import Wallet from './Pages/Wallet';
import Wishlist from './Pages/Wishlist';
import Negotiations from './Pages/Negotiations';

import VendorDashboard from './Pages/Vendor/Dashboard';
import VendorProducts from './Pages/Vendor/Products';
import VendorOrders from './Pages/Vendor/Orders';
import VendorRoute from './Pages/Vendor/Route';
import VendorNegotiations from './Pages/Vendor/Negotiations';

export default function App() {
    const { user } = useAuth();

    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Navbar />
            <Box component="main" sx={{ flexGrow: 1 }}>
                <Routes>
                    <Route path="/" element={user?.role === 'vendor' ? <Navigate to="/vendor" replace /> : <Browse />} />
                    <Route path="/products/:id" element={<ProductDetail />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />

                    <Route path="/cart" element={<ProtectedRoute role="customer"><Cart /></ProtectedRoute>} />
                    <Route path="/checkout" element={<ProtectedRoute role="customer"><Checkout /></ProtectedRoute>} />
                    <Route path="/orders" element={<ProtectedRoute role="customer"><MyOrders /></ProtectedRoute>} />
                    <Route path="/wallet" element={<ProtectedRoute role="customer"><Wallet /></ProtectedRoute>} />
                    <Route path="/wishlist" element={<ProtectedRoute role="customer"><Wishlist /></ProtectedRoute>} />
                    <Route path="/negotiations" element={<ProtectedRoute role="customer"><Negotiations /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

                    <Route path="/vendor" element={<ProtectedRoute role="vendor"><VendorDashboard /></ProtectedRoute>} />
                    <Route path="/vendor/products" element={<ProtectedRoute role="vendor"><VendorProducts /></ProtectedRoute>} />
                    <Route path="/vendor/orders" element={<ProtectedRoute role="vendor"><VendorOrders /></ProtectedRoute>} />
                    <Route path="/vendor/route" element={<ProtectedRoute role="vendor"><VendorRoute /></ProtectedRoute>} />
                    <Route path="/vendor/negotiations" element={<ProtectedRoute role="vendor"><VendorNegotiations /></ProtectedRoute>} />

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Box>
        </Box>
    );
}
