const express = require('express');
const auth = require('../middleware/auth');
const { getOrCreateWallet } = require('../utils/wallet');

const router = express.Router();

router.get('/', auth, async (req, res) => {
    try {
        const wallet = await getOrCreateWallet(req.user.id);
        const recent = [...wallet.transactions].sort((a, b) => b.at - a.at).slice(0, 50);
        res.json({ balance: wallet.balance, transactions: recent });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
