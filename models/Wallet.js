const mongoose = require('mongoose');

const txnSchema = new mongoose.Schema({
    type: { type: String, enum: ['credit', 'debit'], required: true },
    amount: { type: Number, required: true },
    reason: { type: String },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    at: { type: Date, default: Date.now }
}, { _id: false });

const walletSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    balance: { type: Number, default: 0 },
    transactions: [txnSchema]
});

module.exports = mongoose.model('Wallet', walletSchema);
