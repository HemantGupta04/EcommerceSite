const Wallet = require('../models/Wallet');

const CASHBACK_RATE = 0.02;

async function getOrCreateWallet(userId) {
    let wallet = await Wallet.findOne({ user: userId });
    if (!wallet) wallet = await Wallet.create({ user: userId, balance: 0, transactions: [] });
    return wallet;
}

async function credit(userId, amount, reason, orderId) {
    if (amount <= 0) return null;
    const wallet = await getOrCreateWallet(userId);
    wallet.balance = +(wallet.balance + amount).toFixed(2);
    wallet.transactions.push({ type: 'credit', amount, reason, order: orderId });
    await wallet.save();
    return wallet;
}

async function debit(userId, amount, reason, orderId) {
    if (amount <= 0) return { ok: true, applied: 0 };
    const wallet = await getOrCreateWallet(userId);
    const applied = Math.min(wallet.balance, amount);
    if (applied <= 0) return { ok: true, applied: 0 };
    wallet.balance = +(wallet.balance - applied).toFixed(2);
    wallet.transactions.push({ type: 'debit', amount: applied, reason, order: orderId });
    await wallet.save();
    return { ok: true, applied };
}

module.exports = { getOrCreateWallet, credit, debit, CASHBACK_RATE };
