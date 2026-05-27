const express = require('express');
const Negotiation = require('../models/Negotiation');
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const { notify } = require('../utils/notify');

const router = express.Router();

const NEGOTIATION_TTL_HOURS = 6;

router.post('/', auth, async (req, res) => {
    if (req.user.role !== 'customer') return res.status(403).json({ error: 'Customers only' });
    const { productId, proposedPrice, quantity, note } = req.body;
    try {
        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ error: 'Product not found' });
        if (!product.negotiable) return res.status(400).json({ error: 'This item is not negotiable' });
        if (proposedPrice <= 0 || quantity <= 0) return res.status(400).json({ error: 'Invalid offer' });

        const expiresAt = new Date(Date.now() + NEGOTIATION_TTL_HOURS * 3600 * 1000);

        let autoAccept = false;
        if (product.minAcceptablePrice && proposedPrice >= product.minAcceptablePrice) {
            autoAccept = true;
        }

        const negotiation = await Negotiation.create({
            product: product._id,
            customer: req.user.id,
            vendor: product.vendor,
            offers: [{ by: 'customer', price: proposedPrice, quantity, note }],
            status: autoAccept ? 'accepted' : 'open',
            agreedPrice: autoAccept ? proposedPrice : undefined,
            agreedQuantity: autoAccept ? quantity : undefined,
            expiresAt
        });

        if (autoAccept) {
            await notify(req.user.id, 'haggle_accepted',
                `Deal! ₹${proposedPrice}/${product.unit} for ${product.name}`,
                'Your offer was auto-accepted. Proceed to checkout.',
                { negotiationId: negotiation._id });
        } else {
            await notify(product.vendor, 'haggle_offer',
                `New offer on ${product.name}`,
                `Customer offers ₹${proposedPrice}/${product.unit} for ${quantity} ${product.unit}`,
                { negotiationId: negotiation._id });
        }

        res.status(201).json(negotiation);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.post('/:id/counter', auth, async (req, res) => {
    const { price, quantity, note } = req.body;
    try {
        const neg = await Negotiation.findById(req.params.id).populate('product', 'name unit');
        if (!neg) return res.status(404).json({ error: 'Not found' });
        if (neg.status !== 'open') return res.status(400).json({ error: `Already ${neg.status}` });
        if (neg.expiresAt && neg.expiresAt < new Date()) {
            neg.status = 'expired';
            await neg.save();
            return res.status(400).json({ error: 'Negotiation expired' });
        }

        const isVendor = neg.vendor.toString() === req.user.id;
        const isCustomer = neg.customer.toString() === req.user.id;
        if (!isVendor && !isCustomer) return res.status(403).json({ error: 'Not a party to this negotiation' });

        const by = isVendor ? 'vendor' : 'customer';
        neg.offers.push({ by, price, quantity, note });
        await neg.save();

        const recipient = isVendor ? neg.customer : neg.vendor;
        await notify(recipient, 'haggle_offer',
            `Counter-offer on ${neg.product.name}`,
            `${by === 'vendor' ? 'Vendor' : 'Customer'} proposes ₹${price}/${neg.product.unit} for ${quantity} ${neg.product.unit}`,
            { negotiationId: neg._id });

        res.json(neg);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.post('/:id/accept', auth, async (req, res) => {
    try {
        const neg = await Negotiation.findById(req.params.id).populate('product', 'name unit');
        if (!neg) return res.status(404).json({ error: 'Not found' });
        if (neg.status !== 'open') return res.status(400).json({ error: `Already ${neg.status}` });

        const isVendor = neg.vendor.toString() === req.user.id;
        const isCustomer = neg.customer.toString() === req.user.id;
        if (!isVendor && !isCustomer) return res.status(403).json({ error: 'Not a party' });

        const lastOffer = neg.offers[neg.offers.length - 1];
        if ((isVendor && lastOffer.by === 'vendor') || (isCustomer && lastOffer.by === 'customer')) {
            return res.status(400).json({ error: 'Wait for the other party to counter before accepting' });
        }

        neg.status = 'accepted';
        neg.agreedPrice = lastOffer.price;
        neg.agreedQuantity = lastOffer.quantity;
        await neg.save();

        const recipient = isVendor ? neg.customer : neg.vendor;
        await notify(recipient, 'haggle_accepted',
            `Deal locked on ${neg.product.name}`,
            `Final: ₹${neg.agreedPrice}/${neg.product.unit} × ${neg.agreedQuantity}`,
            { negotiationId: neg._id });

        res.json(neg);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.post('/:id/reject', auth, async (req, res) => {
    try {
        const neg = await Negotiation.findById(req.params.id).populate('product', 'name');
        if (!neg) return res.status(404).json({ error: 'Not found' });
        if (neg.status !== 'open') return res.status(400).json({ error: `Already ${neg.status}` });

        const isVendor = neg.vendor.toString() === req.user.id;
        const isCustomer = neg.customer.toString() === req.user.id;
        if (!isVendor && !isCustomer) return res.status(403).json({ error: 'Not a party' });

        neg.status = 'rejected';
        await neg.save();

        const recipient = isVendor ? neg.customer : neg.vendor;
        await notify(recipient, 'haggle_rejected',
            `Offer rejected on ${neg.product.name}`,
            'The other party walked away. Try another offer or vendor.',
            { negotiationId: neg._id });

        res.json(neg);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.get('/mine', auth, async (req, res) => {
    try {
        const field = req.user.role === 'vendor' ? 'vendor' : 'customer';
        const negotiations = await Negotiation.find({ [field]: req.user.id })
            .populate('product', 'name image unit price')
            .populate('customer', 'name')
            .populate('vendor', 'name')
            .sort({ createdAt: -1 });
        res.json(negotiations);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/:id', auth, async (req, res) => {
    try {
        const neg = await Negotiation.findById(req.params.id)
            .populate('product')
            .populate('customer', 'name mobile')
            .populate('vendor', 'name mobile');
        if (!neg) return res.status(404).json({ error: 'Not found' });
        const userId = req.user.id;
        if (neg.customer._id.toString() !== userId && neg.vendor._id.toString() !== userId) {
            return res.status(403).json({ error: 'Not a party' });
        }
        res.json(neg);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
