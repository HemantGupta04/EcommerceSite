const express = require('express');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
    try {
        const items = await Notification.find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .limit(50);
        const unread = await Notification.countDocuments({ user: req.user.id, read: false });
        res.json({ unread, items });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/:id/read', auth, async (req, res) => {
    try {
        const n = await Notification.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id },
            { read: true },
            { new: true }
        );
        if (!n) return res.status(404).json({ error: 'Not found' });
        res.json(n);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.put('/read-all', auth, async (req, res) => {
    try {
        await Notification.updateMany({ user: req.user.id, read: false }, { read: true });
        res.json({ message: 'All marked read' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
