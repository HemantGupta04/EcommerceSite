import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const t = localStorage.getItem('token');
        const u = localStorage.getItem('user');
        if (t && u) {
            try { setUser(JSON.parse(u)); } catch { /* ignore */ }
        }
        setLoading(false);
    }, []);

    const persist = (token, u) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(u));
        setUser(u);
    };

    const login = useCallback(async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password });
        persist(data.token, data.user);
        return data.user;
    }, []);

    const signup = useCallback(async (payload) => {
        const { data } = await api.post('/auth/signup', payload);
        persist(data.token, data.user);
        return data.user;
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    }, []);

    const refreshMe = useCallback(async () => {
        try {
            const { data } = await api.get('/auth/me');
            localStorage.setItem('user', JSON.stringify(data));
            setUser(data);
            return data;
        } catch {
            return null;
        }
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, login, signup, logout, refreshMe }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
