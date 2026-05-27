const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
require('dotenv').config();

if (!process.env.JWT_SECRET) {
    console.warn('[WARN] JWT_SECRET not set — using insecure dev default. Set it in .env for production.');
}

const app = express();
app.set('trust proxy', 1);

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000').split(',').map(s => s.trim());
app.use(cors({
    origin: (origin, cb) => {
        if (!origin) return cb(null, true);
        if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) return cb(null, true);
        return cb(new Error(`Origin ${origin} not allowed`));
    },
    credentials: true
}));

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
const generalLimiter = rateLimit({ windowMs: 60 * 1000, max: 120 });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });
app.use('/api/', generalLimiter);
app.use('/api/auth', authLimiter);

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce')
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log('Mongo error:', err.message));

app.get('/api/health', (req, res) => res.json({ ok: true, ts: Date.now() }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/negotiations', require('./routes/negotiation'));
app.use('/api/vendor', require('./routes/vendor'));
app.use('/api/wallet', require('./routes/wallet'));
app.use('/api/wishlist', require('./routes/wishlist'));
app.use('/api/notifications', require('./routes/notifications'));

app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
