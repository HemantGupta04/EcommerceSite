const express = require('express');
const Wishlist = require('../models/Wishlist');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
    try {
        const items = await Wishlist.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/', auth, async (req, res) => {
    const { productName } = req.body;
    if (!productName) return res.status(400).json({ error: 'productName required' });
    try {
        const item = await Wishlist.findOneAndUpdate(
            { user: req.user.id, productName: productName.toLowerCase().trim() },
            { $setOnInsert: { user: req.user.id, productName: productName.toLowerCase().trim() } },
            { new: true, upsert: true }
        );
        res.status(201).json(item);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.delete('/:id', auth, async (req, res) => {
    try {
        const item = await Wishlist.findOneAndDelete({ _id: req.params.id, user: req.user.id });
        if (!item) return res.status(404).json({ error: 'Not found' });
        res.json({ message: 'Removed' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
