const express = require('express');
const multer = require('multer');
const Product = require('../models/Product');
const User = require('../models/User');
const Wishlist = require('../models/Wishlist');
const auth = require('../middleware/auth');
const { haversineKm } = require('../utils/geo');
const { notify } = require('../utils/notify');
const { storage } = require('../utils/cloudinary');
const { computeDynamicPrice, freshnessLabel } = require('../utils/pricing');

const router = express.Router();

const RADIUS_KM = parseFloat(process.env.MAX_DELIVERY_RADIUS_KM) || 5;

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const ok = /jpe?g|png|webp/i.test(file.mimetype);
        cb(ok ? null : new Error('Only jpg/png/webp'), ok);
    }
});

function decorate(p) {
    const obj = typeof p.toObject === 'function' ? p.toObject() : p;
    const currentPrice = computeDynamicPrice(obj);
    return {
        ...obj,
        currentPrice,
        freshness: freshnessLabel()
    };
}

async function fanoutRestockAlerts(product) {
    const matchName = product.name.toLowerCase();
    const wishes = await Wishlist.find({ productName: matchName });
    for (const w of wishes) {
        const customer = await User.findById(w.user);
        if (!customer?.location?.lat) continue;
        const d = haversineKm(customer.location, (await User.findById(product.vendor)).location);
        if (d <= RADIUS_KM) {
            await notify(customer._id, 'restock',
                `${product.name} is back in stock!`,
                `Available now ${d.toFixed(1)} km away at ₹${product.price}/${product.unit}`,
                { productId: product._id, distanceKm: +d.toFixed(2) });
            w.notifiedAt = new Date();
            await w.save();
        }
    }
}

router.get('/', async (req, res) => {
    try {
        const { vendor, category, q, lat, lng, radius } = req.query;
        const query = {};
        if (vendor) query.vendor = vendor;
        if (category) query.category = category;
        if (q) query.name = new RegExp(q, 'i');

        let products = await Product.find(query).populate('vendor', 'name mobile location vendorSettings');

        if (lat && lng) {
            const me = { lat: parseFloat(lat), lng: parseFloat(lng) };
            const r = parseFloat(radius) || RADIUS_KM;
            products = products
                .map(p => {
                    const d = haversineKm(me, p.vendor?.location);
                    return { ...decorate(p), distanceKm: +d.toFixed(2) };
                })
                .filter(p => p.distanceKm <= r)
                .sort((a, b) => a.distanceKm - b.distanceKm);
        } else {
            products = products.map(decorate);
        }

        res.json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const p = await Product.findById(req.params.id).populate('vendor', 'name mobile location vendorSettings');
        if (!p) return res.status(404).json({ error: 'Not found' });
        res.json(decorate(p));
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

function parsePricingScheme(body) {
    if (body.pricingScheme === undefined && body['pricingScheme.enabled'] === undefined) return undefined;
    if (typeof body.pricingScheme === 'string') {
        try { return JSON.parse(body.pricingScheme); } catch { return undefined; }
    }
    if (body.pricingScheme && typeof body.pricingScheme === 'object') return body.pricingScheme;
    const ps = {};
    if (body['pricingScheme.enabled'] !== undefined) ps.enabled = body['pricingScheme.enabled'] === 'true' || body['pricingScheme.enabled'] === true;
    if (body['pricingScheme.morningPrice']) ps.morningPrice = parseFloat(body['pricingScheme.morningPrice']);
    if (body['pricingScheme.eveningPrice']) ps.eveningPrice = parseFloat(body['pricingScheme.eveningPrice']);
    if (body['pricingScheme.startHour']) ps.startHour = parseInt(body['pricingScheme.startHour'], 10);
    if (body['pricingScheme.endHour']) ps.endHour = parseInt(body['pricingScheme.endHour'], 10);
    return Object.keys(ps).length ? ps : undefined;
}

function parsePrebook(body) {
    if (body.prebook === undefined && body['prebook.enabled'] === undefined) return undefined;
    if (typeof body.prebook === 'string') {
        try { return JSON.parse(body.prebook); } catch { return undefined; }
    }
    if (body.prebook && typeof body.prebook === 'object') return body.prebook;
    const p = {};
    if (body['prebook.enabled'] !== undefined) p.enabled = body['prebook.enabled'] === 'true' || body['prebook.enabled'] === true;
    if (body['prebook.discountPercent']) p.discountPercent = parseFloat(body['prebook.discountPercent']);
    return Object.keys(p).length ? p : undefined;
}

router.post('/', auth, upload.single('image'), async (req, res) => {
    if (req.user.role !== 'vendor') return res.status(403).json({ error: 'Vendor only' });
    const { name, description, price, category, stockQuantity, unit, negotiable, minAcceptablePrice } = req.body;
    try {
        const pricingScheme = parsePricingScheme(req.body);
        const prebook = parsePrebook(req.body);
        const product = await Product.create({
            name,
            description,
            price: parseFloat(price),
            image: req.file ? req.file.path : req.body.image,
            category,
            stockQuantity: stockQuantity ? parseInt(stockQuantity, 10) : 0,
            unit,
            negotiable: negotiable === 'false' ? false : true,
            minAcceptablePrice: minAcceptablePrice ? parseFloat(minAcceptablePrice) : undefined,
            inStock: stockQuantity ? parseInt(stockQuantity, 10) > 0 : true,
            vendor: req.user.id,
            ...(pricingScheme ? { pricingScheme } : {}),
            ...(prebook ? { prebook } : {})
        });
        if (product.stockQuantity > 0) fanoutRestockAlerts(product).catch(e => console.error(e));
        res.status(201).json(decorate(product));
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.put('/:id', auth, upload.single('image'), async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ error: 'Not found' });
        if (product.vendor.toString() !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

        const wasOut = (product.stockQuantity || 0) === 0;

        const updatable = ['name', 'description', 'price', 'category', 'stockQuantity', 'unit', 'negotiable', 'minAcceptablePrice', 'inStock'];
        for (const k of updatable) {
            if (req.body[k] !== undefined) product[k] = req.body[k];
        }
        const pricingScheme = parsePricingScheme(req.body);
        if (pricingScheme) product.pricingScheme = { ...(product.pricingScheme?.toObject?.() || product.pricingScheme || {}), ...pricingScheme };
        const prebook = parsePrebook(req.body);
        if (prebook) product.prebook = { ...(product.prebook?.toObject?.() || product.prebook || {}), ...prebook };
        if (req.file) product.image = req.file.path;
        if (product.stockQuantity > 0) product.inStock = true;
        await product.save();

        const nowIn = (product.stockQuantity || 0) > 0;
        if (wasOut && nowIn) fanoutRestockAlerts(product).catch(e => console.error(e));

        res.json(decorate(product));
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.delete('/:id', auth, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ error: 'Not found' });
        if (product.vendor.toString() !== req.user.id) return res.status(403).json({ error: 'Not authorized' });
        await Product.deleteOne({ _id: product._id });
        res.json({ message: 'Product deleted' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
