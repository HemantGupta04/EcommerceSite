const express = require('express');
const mongoose = require('mongoose');
const ExcelJS = require('exceljs');
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

router.get('/settings', auth, vendorOnly, async (req, res) => {
    try {
        const u = await User.findById(req.user.id).select('vendorSettings name email mobile address location');
        res.json(u);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/settings', auth, vendorOnly, async (req, res) => {
    try {
        const u = await User.findById(req.user.id);
        if (!u) return res.status(404).json({ error: 'Not found' });
        const incoming = req.body.vendorSettings || req.body;
        const cleaned = {};
        if (incoming.freeDeliveryCap !== undefined) {
            const v = parseFloat(incoming.freeDeliveryCap);
            if (!isFinite(v) || v < 0) return res.status(400).json({ error: 'freeDeliveryCap must be ≥ 0' });
            cleaned.freeDeliveryCap = v;
        }
        if (incoming.deliveryFee !== undefined) {
            const v = parseFloat(incoming.deliveryFee);
            if (!isFinite(v) || v < 0) return res.status(400).json({ error: 'deliveryFee must be ≥ 0' });
            cleaned.deliveryFee = v;
        }
        if (incoming.shopName !== undefined) cleaned.shopName = String(incoming.shopName).slice(0, 80);
        if (incoming.tagline !== undefined) cleaned.tagline = String(incoming.tagline).slice(0, 160);
        u.vendorSettings = { ...(u.vendorSettings?.toObject?.() || u.vendorSettings || {}), ...cleaned };
        await u.save();
        res.json(u.vendorSettings);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.get('/insights', auth, vendorOnly, async (req, res) => {
    try {
        const vendorId = new mongoose.Types.ObjectId(req.user.id);
        const sinceDays = parseInt(req.query.days, 10) || 30;
        const since = new Date(Date.now() - sinceDays * 24 * 3600 * 1000);

        const [
            summary, topItems, peakHours, repeatCustomers, statusBreakdown, daily,
            categorySplit, prebookStats, hourlyRevenue, avgDistance, cancellations
        ] = await Promise.all([
            Order.aggregate([
                { $match: { vendor: vendorId, createdAt: { $gte: since } } },
                { $group: {
                    _id: null,
                    orders: { $sum: 1 },
                    revenue: { $sum: '$total' },
                    delivered: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
                    cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
                    deliveryFees: { $sum: '$deliveryFee' },
                    prebookDiscounts: { $sum: '$prebookDiscount' }
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
            ]),
            Order.aggregate([
                { $match: { vendor: vendorId, createdAt: { $gte: since } } },
                { $unwind: '$items' },
                { $lookup: { from: 'products', localField: 'items.product', foreignField: '_id', as: 'p' } },
                { $unwind: { path: '$p', preserveNullAndEmptyArrays: true } },
                { $group: {
                    _id: '$p.category',
                    qty: { $sum: '$items.quantity' },
                    revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
                } },
                { $project: { _id: 0, category: { $ifNull: ['$_id', 'other'] }, qty: 1, revenue: 1 } }
            ]),
            Order.aggregate([
                { $match: { vendor: vendorId, createdAt: { $gte: since } } },
                { $group: {
                    _id: null,
                    total: { $sum: 1 },
                    prebooks: { $sum: { $cond: ['$isPrebook', 1, 0] } },
                    prebookRevenue: { $sum: { $cond: ['$isPrebook', '$total', 0] } }
                } }
            ]),
            Order.aggregate([
                { $match: { vendor: vendorId, createdAt: { $gte: since } } },
                { $group: { _id: { $hour: '$createdAt' }, revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
                { $sort: { _id: 1 } },
                { $project: { _id: 0, hour: '$_id', revenue: 1, orders: 1 } }
            ]),
            Order.aggregate([
                { $match: { vendor: vendorId, createdAt: { $gte: since } } },
                { $group: { _id: null, avg: { $avg: '$distanceKm' }, max: { $max: '$distanceKm' } } }
            ]),
            Order.aggregate([
                { $match: { vendor: vendorId, status: 'cancelled', createdAt: { $gte: since } } },
                { $unwind: '$statusHistory' },
                { $match: { 'statusHistory.status': 'cancelled' } },
                { $group: { _id: { $ifNull: ['$statusHistory.note', 'No reason'] }, count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 5 }
            ])
        ]);

        const s = summary[0] || { orders: 0, revenue: 0, delivered: 0, cancelled: 0, deliveryFees: 0, prebookDiscounts: 0 };
        const pb = prebookStats[0] || { total: 0, prebooks: 0, prebookRevenue: 0 };
        const dist = avgDistance[0] || { avg: 0, max: 0 };

        res.json({
            window: { sinceDays, since },
            summary: {
                orders: s.orders,
                revenue: +s.revenue.toFixed(2),
                delivered: s.delivered,
                cancelled: s.cancelled,
                deliveryRate: s.orders ? +(s.delivered / s.orders * 100).toFixed(1) : 0,
                avgOrderValue: s.orders ? +(s.revenue / s.orders).toFixed(2) : 0,
                deliveryFees: +(s.deliveryFees || 0).toFixed(2),
                prebookDiscounts: +(s.prebookDiscounts || 0).toFixed(2),
                prebookConversion: pb.total ? +(pb.prebooks / pb.total * 100).toFixed(1) : 0,
                prebookRevenue: +(pb.prebookRevenue || 0).toFixed(2),
                avgDistanceKm: +(dist.avg || 0).toFixed(2),
                maxDistanceKm: +(dist.max || 0).toFixed(2)
            },
            topItems,
            peakHours,
            repeatCustomers,
            statusBreakdown: Object.fromEntries(statusBreakdown.map(x => [x._id, x.count])),
            dailyTrend: daily,
            categorySplit,
            hourlyRevenue,
            cancellations: cancellations.map(c => ({ reason: c._id, count: c.count }))
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
            address: o.customerAddress,
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

function sendXlsx(res, workbook, filename) {
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return workbook.xlsx.write(res).then(() => res.end());
}

router.get('/export/orders.xlsx', auth, vendorOnly, async (req, res) => {
    try {
        const orders = await Order.find({ vendor: req.user.id })
            .populate('customer', 'name mobile email')
            .sort({ createdAt: -1 });
        const wb = new ExcelJS.Workbook();
        wb.creator = 'TrustMandi';
        const ws = wb.addWorksheet('Orders');
        ws.columns = [
            { header: 'Order ID', key: 'id', width: 16 },
            { header: 'Date', key: 'date', width: 20 },
            { header: 'Customer', key: 'name', width: 22 },
            { header: 'Mobile', key: 'mobile', width: 14 },
            { header: 'Address', key: 'address', width: 38 },
            { header: 'Items', key: 'items', width: 42 },
            { header: 'Subtotal', key: 'subtotal', width: 11 },
            { header: 'Pre-book disc.', key: 'prebookDisc', width: 14 },
            { header: 'Delivery fee', key: 'fee', width: 12 },
            { header: 'Wallet', key: 'wallet', width: 10 },
            { header: 'Total', key: 'total', width: 10 },
            { header: 'Distance (km)', key: 'dist', width: 13 },
            { header: 'Pre-book?', key: 'prebook', width: 11 },
            { header: 'Status', key: 'status', width: 14 }
        ];
        ws.getRow(1).font = { bold: true };
        ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE0B2' } };
        for (const o of orders) {
            ws.addRow({
                id: o._id.toString().slice(-6).toUpperCase(),
                date: new Date(o.createdAt).toLocaleString('en-IN'),
                name: o.customer?.name || '-',
                mobile: o.customerMobile,
                address: o.customerAddress,
                items: o.items.map(i => `${i.quantity} ${i.name}`).join('; '),
                subtotal: o.subtotal,
                prebookDisc: o.prebookDiscount || 0,
                fee: o.deliveryFee || 0,
                wallet: o.walletApplied || 0,
                total: o.total,
                dist: o.distanceKm,
                prebook: o.isPrebook ? 'Yes' : 'No',
                status: o.status
            });
        }
        await sendXlsx(res, wb, `orders-${Date.now()}.xlsx`);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/export/products.xlsx', auth, vendorOnly, async (req, res) => {
    try {
        const products = await Product.find({ vendor: req.user.id }).sort({ createdAt: -1 });
        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet('Products');
        ws.columns = [
            { header: 'Name', key: 'name', width: 24 },
            { header: 'Category', key: 'category', width: 12 },
            { header: 'Base price', key: 'price', width: 12 },
            { header: 'Unit', key: 'unit', width: 8 },
            { header: 'Stock', key: 'stock', width: 8 },
            { header: 'Sold', key: 'sold', width: 8 },
            { header: 'Dynamic pricing', key: 'dyn', width: 18 },
            { header: 'Morning price', key: 'morn', width: 14 },
            { header: 'Evening price', key: 'eve', width: 14 },
            { header: 'Pre-book', key: 'pb', width: 10 },
            { header: 'Pre-book %', key: 'pbDisc', width: 12 },
            { header: 'Negotiable', key: 'neg', width: 11 }
        ];
        ws.getRow(1).font = { bold: true };
        ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC8E6C9' } };
        for (const p of products) {
            const ps = p.pricingScheme || {};
            const pb = p.prebook || {};
            ws.addRow({
                name: p.name,
                category: p.category,
                price: p.price,
                unit: p.unit,
                stock: p.stockQuantity ?? 0,
                sold: p.salesCount ?? 0,
                dyn: ps.enabled ? `${ps.startHour}h–${ps.endHour}h` : 'off',
                morn: ps.morningPrice ?? '',
                eve: ps.eveningPrice ?? '',
                pb: pb.enabled ? 'Yes' : 'No',
                pbDisc: pb.discountPercent ?? 0,
                neg: p.negotiable ? 'Yes' : 'No'
            });
        }
        await sendXlsx(res, wb, `products-${Date.now()}.xlsx`);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/export/insights.xlsx', auth, vendorOnly, async (req, res) => {
    try {
        const vendorId = new mongoose.Types.ObjectId(req.user.id);
        const sinceDays = parseInt(req.query.days, 10) || 30;
        const since = new Date(Date.now() - sinceDays * 24 * 3600 * 1000);

        const [daily, topItems, repeats, hourly] = await Promise.all([
            Order.aggregate([
                { $match: { vendor: vendorId, createdAt: { $gte: since } } },
                { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, orders: { $sum: 1 }, revenue: { $sum: '$total' } } },
                { $sort: { _id: 1 } }
            ]),
            Order.aggregate([
                { $match: { vendor: vendorId, createdAt: { $gte: since } } },
                { $unwind: '$items' },
                { $group: { _id: '$items.name', qty: { $sum: '$items.quantity' }, revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
                { $sort: { revenue: -1 } }
            ]),
            Order.aggregate([
                { $match: { vendor: vendorId, createdAt: { $gte: since } } },
                { $group: { _id: '$customer', orders: { $sum: 1 }, spent: { $sum: '$total' } } },
                { $sort: { spent: -1 } },
                { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'u' } },
                { $unwind: '$u' },
                { $project: { _id: 0, name: '$u.name', mobile: '$u.mobile', orders: 1, spent: 1 } }
            ]),
            Order.aggregate([
                { $match: { vendor: vendorId, createdAt: { $gte: since } } },
                { $group: { _id: { $hour: '$createdAt' }, orders: { $sum: 1 }, revenue: { $sum: '$total' } } },
                { $sort: { _id: 1 } }
            ])
        ]);

        const wb = new ExcelJS.Workbook();
        const styleHeader = (ws, color) => {
            ws.getRow(1).font = { bold: true };
            ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
        };

        const wsDaily = wb.addWorksheet('Daily revenue');
        wsDaily.columns = [
            { header: 'Date', key: 'd', width: 14 },
            { header: 'Orders', key: 'o', width: 10 },
            { header: 'Revenue (₹)', key: 'r', width: 14 }
        ];
        daily.forEach(d => wsDaily.addRow({ d: d._id, o: d.orders, r: +d.revenue.toFixed(2) }));
        styleHeader(wsDaily, 'FFFFE0B2');

        const wsTop = wb.addWorksheet('Top items');
        wsTop.columns = [
            { header: 'Item', key: 'n', width: 24 },
            { header: 'Qty sold', key: 'q', width: 12 },
            { header: 'Revenue (₹)', key: 'r', width: 14 }
        ];
        topItems.forEach(i => wsTop.addRow({ n: i._id, q: i.qty, r: +i.revenue.toFixed(2) }));
        styleHeader(wsTop, 'FFC8E6C9');

        const wsCust = wb.addWorksheet('Customers');
        wsCust.columns = [
            { header: 'Name', key: 'n', width: 22 },
            { header: 'Mobile', key: 'm', width: 14 },
            { header: 'Orders', key: 'o', width: 10 },
            { header: 'Spent (₹)', key: 's', width: 12 }
        ];
        repeats.forEach(c => wsCust.addRow({ n: c.name, m: c.mobile, o: c.orders, s: +c.spent.toFixed(2) }));
        styleHeader(wsCust, 'FFFFCCBC');

        const wsH = wb.addWorksheet('Hourly');
        wsH.columns = [
            { header: 'Hour', key: 'h', width: 8 },
            { header: 'Orders', key: 'o', width: 10 },
            { header: 'Revenue (₹)', key: 'r', width: 14 }
        ];
        hourly.forEach(h => wsH.addRow({ h: `${h._id}:00`, o: h.orders, r: +h.revenue.toFixed(2) }));
        styleHeader(wsH, 'FFFFF59D');

        await sendXlsx(res, wb, `insights-${sinceDays}d-${Date.now()}.xlsx`);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
