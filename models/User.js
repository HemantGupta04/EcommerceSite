const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['vendor', 'customer'], default: 'customer' },
    mobile: { type: String },
    address: { type: String },
    location: {
        lat: { type: Number },
        lng: { type: Number }
    },
    vendorSettings: {
        freeDeliveryCap: { type: Number, default: 200 },
        deliveryFee: { type: Number, default: 20 },
        shopName: { type: String },
        tagline: { type: String }
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
