const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: { type: String },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    negotiatedPrice: { type: Number },
    dynamicPrice: { type: Number },
    prebookDiscountPercent: { type: Number, default: 0 }
}, { _id: false });

const statusEventSchema = new mongoose.Schema({
    status: { type: String },
    at: { type: Date, default: Date.now },
    note: { type: String }
}, { _id: false });

const orderSchema = new mongoose.Schema({
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: [orderItemSchema],
    subtotal: { type: Number, required: true },
    prebookDiscount: { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 0 },
    walletApplied: { type: Number, default: 0 },
    cashbackEarned: { type: Number, default: 0 },
    total: { type: Number, required: true },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'out_for_delivery', 'delivered', 'cancelled'],
        default: 'pending',
        index: true
    },
    statusHistory: [statusEventSchema],
    deliveryOtp: { type: String },
    customerMobile: { type: String, required: true },
    customerAddress: { type: String, required: true },
    customerLocation: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true }
    },
    distanceKm: { type: Number },
    isPrebook: { type: Boolean, default: false },
    prebookFor: { type: Date },
    forceCompleted: { type: Boolean, default: false },
    forceCompleteReason: { type: String },
    vendorMessageDraft: { type: String },
    createdAt: { type: Date, default: Date.now, index: true }
});

module.exports = mongoose.model('Order', orderSchema);
