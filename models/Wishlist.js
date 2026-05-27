const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    productName: { type: String, required: true, lowercase: true, trim: true },
    notifiedAt: { type: Date },
    createdAt: { type: Date, default: Date.now }
});

wishlistSchema.index({ user: 1, productName: 1 }, { unique: true });

module.exports = mongoose.model('Wishlist', wishlistSchema);
