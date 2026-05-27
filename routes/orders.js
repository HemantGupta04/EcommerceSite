const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Negotiation = require('../models/Negotiation');
const auth = require('../middleware/auth');
const { haversineKm } = require('../utils/geo');
const { credit, debit, CASHBACK_RATE } = require('../utils/wallet');
const { notify } = require('../utils/notify');

const router = express.Router();

const RADIUS_KM = parseFloat(process.env.MAX_DELIVERY_RADIUS_KM) || 5;

function makeOtp() {
    return ('' + Math.floor(1000 + Math.random() * 9000));
}

function draftVendorMessage(order, customerName) {
    const lines = order.items.map(i => `• ${i.quantity} ${i.name} @ ₹${i.negotiatedPrice ?? i.price}`).join('\n');
    return `New order #${order._id.toString().slice(-6).toUpperCase()}\n${lines}\nTotal: ₹${order.total}\nCustomer: ${customerName} (${order.customerMobile})\nDistance: ~${order.distanceKm} km\nOTP at delivery: ${order.deliveryOtp}`;
}

router.post('/', auth, async (req, res) => {
    const { items, customerMobile, customerLocation, useWallet, negotiationId } = req.body;
    if (!items?.length) return res.status(400).json({ error: 'Cart is empty' });
    if (!customerLocation?.lat) return res.status(400).json({ error: 'Location required' });

    try {
        const productIds = items.map(i => i.product);
        const products = await Product.find({ _id: { $in: productIds } });
        if (products.length !== items.length) return res.status(400).json({ error: 'Some products missing' });

        const vendorIds = [...new Set(products.map(p => p.vendor.toString()))];
        if (vendorIds.length > 1) return res.status(400).json({ error: 'Order spans multiple vendors — split the cart' });

        const vendor = await User.findById(vendorIds[0]);
        if (!vendor) return res.status(400).json({ error: 'Vendor missing' });
        const distanceKm = haversineKm(customerLocation, vendor.location);
        if (distanceKm > RADIUS_KM) {
            return res.status(400).json({ error: `Vendor is ${distanceKm.toFixed(1)} km away — beyond 5 km radius` });
        }

        let negotiatedPriceMap = {};
        if (negotiationId) {
            const neg = await Negotiation.findById(negotiationId);
            if (!neg || neg.status !== 'accepted' || neg.customer.toString() !== req.user.id) {
                return res.status(400).json({ error: 'Invalid or unaccepted negotiation' });
            }
            negotiatedPriceMap[neg.product.toString()] = neg.agreedPrice;
        }

        const lineItems = [];
        let subtotal = 0;
        for (const i of items) {
            const p = products.find(x => x._id.toString() === i.product);
            if (p.stockQuantity > 0 && i.quantity > p.stockQuantity) {
                return res.status(400).json({ error: `Only ${p.stockQuantity} ${p.unit} of ${p.name} left` });
            }
            const negPrice = negotiatedPriceMap[p._id.toString()];
            const unitPrice = negPrice ?? p.price;
            const lineTotal = unitPrice * i.quantity;
            subtotal += lineTotal;
            lineItems.push({
                product: p._id,
                name: p.name,
                quantity: i.quantity,
                price: p.price,
                negotiatedPrice: negPrice
            });
        }
        subtotal = +subtotal.toFixed(2);

        let walletApplied = 0;
        if (useWallet) {
            const { applied } = await debit(req.user.id, subtotal, 'Order payment');
            walletApplied = applied;
        }

        const total = +(subtotal - walletApplied).toFixed(2);
        const deliveryOtp = makeOtp();

        const order = await Order.create({
            customer: req.user.id,
            vendor: vendor._id,
            items: lineItems,
            subtotal,
            walletApplied,
            total,
            status: 'pending',
            statusHistory: [{ status: 'pending', note: 'Order placed' }],
            deliveryOtp,
            customerMobile,
            customerLocation,
            distanceKm: +distanceKm.toFixed(2)
        });

        const customer = await User.findById(req.user.id);
        order.vendorMessageDraft = draftVendorMessage(order, customer.name);
        await order.save();

        for (const li of lineItems) {
            await Product.updateOne({ _id: li.product }, {
                $inc: { stockQuantity: -li.quantity, salesCount: li.quantity }
            });
        }

        await notify(vendor._id, 'order_new', 'New order received', order.vendorMessageDraft, { orderId: order._id });

        const waLink = vendor.mobile
            ? `https://wa.me/${vendor.mobile.replace(/\D/g, '')}?text=${encodeURIComponent(order.vendorMessageDraft)}`
            : null;

        res.status(201).json({ ...order.toObject(), whatsappLink: waLink });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.get('/vendor', auth, async (req, res) => {
    if (req.user.role !== 'vendor') return res.status(403).json({ error: 'Vendor only' });
    try {
        const orders = await Order.find({ vendor: req.user.id })
            .populate('customer', 'name mobile')
            .populate('items.product')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/customer', auth, async (req, res) => {
    try {
        const orders = await Order.find({ customer: req.user.id })
            .populate('vendor', 'name mobile')
            .populate('items.product')
            .sort({ createdAt: -1 });
        res.json(orders.map(o => {
            const obj = o.toObject();
            if (o.status !== 'delivered' && o.status !== 'cancelled') {
                delete obj.deliveryOtp;
            }
            return obj;
        }));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/:id/status', auth, async (req, res) => {
    const { status, note } = req.body;
    const allowed = ['accepted', 'out_for_delivery', 'cancelled'];
    if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status for this endpoint' });
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ error: 'Not found' });
        if (order.vendor.toString() !== req.user.id) return res.status(403).json({ error: 'Not authorized' });
        order.status = status;
        order.statusHistory.push({ status, note });
        await order.save();
        await notify(order.customer, 'order_status',
            `Order ${status.replace('_', ' ')}`,
            note || `Vendor updated your order to ${status}`,
            { orderId: order._id });
        res.json(order);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.post('/:id/deliver', auth, async (req, res) => {
    const { otp } = req.body;
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ error: 'Not found' });
        if (order.vendor.toString() !== req.user.id) return res.status(403).json({ error: 'Not authorized' });
        if (order.status === 'delivered') return res.status(400).json({ error: 'Already delivered' });
        if (otp !== order.deliveryOtp) return res.status(400).json({ error: 'Wrong OTP' });

        order.status = 'delivered';
        order.statusHistory.push({ status: 'delivered', note: 'OTP verified at doorstep' });

        const cashback = +(order.subtotal * CASHBACK_RATE).toFixed(2);
        order.cashbackEarned = cashback;
        await order.save();

        if (cashback > 0) {
            await credit(order.customer, cashback, `Cashback for order ${order._id}`, order._id);
            await notify(order.customer, 'cashback',
                `₹${cashback} cashback credited`,
                `Earned ${(CASHBACK_RATE * 100)}% back on your delivered order`,
                { orderId: order._id, amount: cashback });
        }

        await notify(order.customer, 'order_status', 'Order delivered',
            `Enjoy your ${order.items.map(i => i.name).join(', ')}!`,
            { orderId: order._id });

        res.json(order);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
