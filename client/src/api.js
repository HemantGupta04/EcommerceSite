import axios from 'axios';

export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

const api = axios.create({ baseURL: `${API_URL}/api` });

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

api.interceptors.response.use(
    (r) => r,
    (err) => {
        if (err.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            if (window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(err);
    }
);

export const errorMessage = (err) =>
    err?.response?.data?.error || err?.message || 'Something went wrong';

export const fileUrl = (p) => (p?.startsWith('http') ? p : `${API_URL}${p}`);

export default api;
