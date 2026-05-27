const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true, index: true },
    description: { type: String },
    price: { type: Number, required: true },
    image: { type: String },
    category: { type: String, enum: ['fruit', 'vegetable'], required: true },
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    stockQuantity: { type: Number, default: 0 },
    inStock: { type: Boolean, default: true },
    unit: { type: String, default: 'kg' },
    negotiable: { type: Boolean, default: true },
    minAcceptablePrice: { type: Number },
    salesCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

productSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Product', productSchema);
