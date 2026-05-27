const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

const signToken = (user) => jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || 'dev-only-secret-change-me',
    { expiresIn: '7d' }
);

const sanitize = (u) => ({
    _id: u._id,
    name: u.name,
    email: u.email,
    role: u.role,
    mobile: u.mobile,
    location: u.location
});

router.post('/signup',
    body('name').trim().isLength({ min: 2, max: 60 }),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 chars'),
    body('role').optional().isIn(['vendor', 'customer']),
    body('mobile').optional().matches(/^[0-9+\- ]{7,15}$/),
    body('location.lat').optional().isFloat({ min: -90, max: 90 }),
    body('location.lng').optional().isFloat({ min: -180, max: 180 }),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

        const { name, email, password, role, mobile, location } = req.body;
        try {
            const exists = await User.findOne({ email });
            if (exists) return res.status(409).json({ error: 'Email already registered' });

            const hashedPassword = await bcrypt.hash(password, 10);
            const user = await User.create({ name, email, password: hashedPassword, role, mobile, location });
            const token = signToken(user);
            res.status(201).json({ token, user: sanitize(user) });
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    });

router.post('/login',
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 1 }),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

        const { email, password } = req.body;
        try {
            const user = await User.findOne({ email });
            if (!user || !(await bcrypt.compare(password, user.password))) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
            const token = signToken(user);
            res.json({ token, user: sanitize(user) });
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    });

router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(sanitize(user));
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.put('/me', auth,
    body('location.lat').optional().isFloat({ min: -90, max: 90 }),
    body('location.lng').optional().isFloat({ min: -180, max: 180 }),
    body('mobile').optional().matches(/^[0-9+\- ]{7,15}$/),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
        try {
            const user = await User.findById(req.user.id);
            if (!user) return res.status(404).json({ error: 'User not found' });
            ['name', 'mobile', 'location'].forEach(k => {
                if (req.body[k] !== undefined) user[k] = req.body[k];
            });
            await user.save();
            res.json(sanitize(user));
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    });

module.exports = router;
