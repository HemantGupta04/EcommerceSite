const express = require('express');
const path = require('path');
const multer = require('multer');
const Product = require('../models/Product');
const User = require('../models/User');
const Wishlist = require('../models/Wishlist');
const auth = require('../middleware/auth');
const { haversineKm } = require('../utils/geo');
const { notify } = require('../utils/notify');

const router = express.Router();

const RADIUS_KM = parseFloat(process.env.MAX_DELIVERY_RADIUS_KM) || 5;

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads')),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const ok = /jpe?g|png|webp/i.test(file.mimetype);
        cb(ok ? null : new Error('Only jpg/png/webp'), ok);
    }
});

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

        let products = await Product.find(query).populate('vendor', 'name mobile location');

        if (lat && lng) {
            const me = { lat: parseFloat(lat), lng: parseFloat(lng) };
            const r = parseFloat(radius) || RADIUS_KM;
            products = products
                .map(p => {
                    const d = haversineKm(me, p.vendor?.location);
                    return { ...p.toObject(), distanceKm: +d.toFixed(2) };
                })
                .filter(p => p.distanceKm <= r)
                .sort((a, b) => a.distanceKm - b.distanceKm);
        }

        res.json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const p = await Product.findById(req.params.id).populate('vendor', 'name mobile location');
        if (!p) return res.status(404).json({ error: 'Not found' });
        res.json(p);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.post('/', auth, upload.single('image'), async (req, res) => {
    if (req.user.role !== 'vendor') return res.status(403).json({ error: 'Vendor only' });
    const { name, description, price, category, stockQuantity, unit, negotiable, minAcceptablePrice } = req.body;
    try {
        const product = await Product.create({
            name,
            description,
            price: parseFloat(price),
            image: req.file ? `/uploads/${req.file.filename}` : req.body.image,
            category,
            stockQuantity: stockQuantity ? parseInt(stockQuantity, 10) : 0,
            unit,
            negotiable: negotiable === 'false' ? false : true,
            minAcceptablePrice: minAcceptablePrice ? parseFloat(minAcceptablePrice) : undefined,
            inStock: stockQuantity ? parseInt(stockQuantity, 10) > 0 : true,
            vendor: req.user.id
        });
        if (product.stockQuantity > 0) fanoutRestockAlerts(product).catch(e => console.error(e));
        res.status(201).json(product);
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
        if (req.file) product.image = `/uploads/${req.file.filename}`;
        if (product.stockQuantity > 0) product.inStock = true;
        await product.save();

        const nowIn = (product.stockQuantity || 0) > 0;
        if (wasOut && nowIn) fanoutRestockAlerts(product).catch(e => console.error(e));

        res.json(product);
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
