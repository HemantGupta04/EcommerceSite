const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
        type: String,
        enum: ['order_new', 'order_status', 'haggle_offer', 'haggle_accepted', 'haggle_rejected', 'restock', 'cashback'],
        required: true
    },
    title: { type: String, required: true },
    body: { type: String },
    data: { type: mongoose.Schema.Types.Mixed },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now, index: true }
});

module.exports = mongoose.model('Notification', notificationSchema);
