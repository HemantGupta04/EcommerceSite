const express = require('express');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { optimizeRoute } = require('../utils/routeOptimizer');

const router = express.Router();

const vendorOnly = (req, res, next) => {
    if (req.user.role !== 'vendor') return res.status(403).json({ error: 'Vendor only' });
    next();
};

router.get('/insights', auth, vendorOnly, async (req, res) => {
    try {
        const vendorId = new mongoose.Types.ObjectId(req.user.id);
        const sinceDays = parseInt(req.query.days, 10) || 30;
        const since = new Date(Date.now() - sinceDays * 24 * 3600 * 1000);

        const [summary, topItems, peakHours, repeatCustomers, statusBreakdown, daily] = await Promise.all([
            Order.aggregate([
                { $match: { vendor: vendorId, createdAt: { $gte: since } } },
                { $group: {
                    _id: null,
                    orders: { $sum: 1 },
                    revenue: { $sum: '$total' },
                    delivered: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
                    cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } }
                } }
            ]),
            Order.aggregate([
                { $match: { vendor: vendorId, createdAt: { $gte: since } } },
                { $unwind: '$items' },
                { $group: {
                    _id: '$items.product',
                    name: { $first: '$items.name' },
                    qty: { $sum: '$items.quantity' },
                    revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
                    orders: { $sum: 1 }
                } },
                { $sort: { revenue: -1 } },
                { $limit: 5 }
            ]),
            Order.aggregate([
                { $match: { vendor: vendorId, createdAt: { $gte: since } } },
                { $group: { _id: { $hour: '$createdAt' }, orders: { $sum: 1 } } },
                { $sort: { orders: -1 } },
                { $limit: 5 },
                { $project: { _id: 0, hour: '$_id', orders: 1 } }
            ]),
            Order.aggregate([
                { $match: { vendor: vendorId, createdAt: { $gte: since } } },
                { $group: { _id: '$customer', orders: { $sum: 1 }, spent: { $sum: '$total' } } },
                { $match: { orders: { $gt: 1 } } },
                { $sort: { spent: -1 } },
                { $limit: 5 },
                { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'u' } },
                { $unwind: '$u' },
                { $project: { _id: 0, customer: '$u.name', mobile: '$u.mobile', orders: 1, spent: 1 } }
            ]),
            Order.aggregate([
                { $match: { vendor: vendorId, createdAt: { $gte: since } } },
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]),
            Order.aggregate([
                { $match: { vendor: vendorId, createdAt: { $gte: since } } },
                { $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    orders: { $sum: 1 },
                    revenue: { $sum: '$total' }
                } },
                { $sort: { _id: 1 } }
            ])
        ]);

        const s = summary[0] || { orders: 0, revenue: 0, delivered: 0, cancelled: 0 };
        res.json({
            window: { sinceDays, since },
            summary: {
                orders: s.orders,
                revenue: +s.revenue.toFixed(2),
                delivered: s.delivered,
                cancelled: s.cancelled,
                deliveryRate: s.orders ? +(s.delivered / s.orders * 100).toFixed(1) : 0,
                avgOrderValue: s.orders ? +(s.revenue / s.orders).toFixed(2) : 0
            },
            topItems,
            peakHours,
            repeatCustomers,
            statusBreakdown: Object.fromEntries(statusBreakdown.map(x => [x._id, x.count])),
            dailyTrend: daily
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/route', auth, vendorOnly, async (req, res) => {
    try {
        const vendor = await User.findById(req.user.id);
        if (!vendor?.location?.lat) return res.status(400).json({ error: 'Set your vendor location first' });

        const orders = await Order.find({
            vendor: req.user.id,
            status: { $in: ['accepted', 'out_for_delivery'] }
        }).populate('customer', 'name mobile');

        if (!orders.length) return res.json({ totalKm: 0, etaMinutes: 0, stops: [] });

        const stops = orders.map(o => ({
            orderId: o._id,
            customer: o.customer?.name,
            mobile: o.customerMobile,
            total: o.total,
            location: o.customerLocation
        }));

        const plan = optimizeRoute(vendor.location, stops);
        plan.start = { lat: vendor.location.lat, lng: vendor.location.lng };
        plan.mapsLink = `https://www.google.com/maps/dir/${plan.start.lat},${plan.start.lng}/` +
            plan.stops.map(s => `${s.location.lat},${s.location.lng}`).join('/');
        res.json(plan);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
