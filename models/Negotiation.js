const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
    by: { type: String, enum: ['customer', 'vendor'], required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    note: { type: String },
    at: { type: Date, default: Date.now }
}, { _id: false });

const negotiationSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    offers: [offerSchema],
    status: {
        type: String,
        enum: ['open', 'accepted', 'rejected', 'expired'],
        default: 'open'
    },
    agreedPrice: { type: Number },
    agreedQuantity: { type: Number },
    expiresAt: { type: Date },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Negotiation', negotiationSchema);
