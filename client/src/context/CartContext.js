import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

const CartContext = createContext(null);
const KEY = 'cart:v2';

export const CartProvider = ({ children }) => {
    const [items, setItems] = useState([]);

    useEffect(() => {
        try {
            const raw = localStorage.getItem(KEY);
            if (raw) setItems(JSON.parse(raw));
        } catch { /* ignore */ }
    }, []);

    const persist = (next) => {
        setItems(next);
        localStorage.setItem(KEY, JSON.stringify(next));
    };

    const add = useCallback((product, quantity = 1, negotiation = null) => {
        setItems(prev => {
            const idx = prev.findIndex(i => i.productId === product._id);
            const livePrice = negotiation?.agreedPrice
                ?? (product.currentPrice ?? product.price);
            let next;
            if (idx >= 0) {
                next = [...prev];
                next[idx] = { ...next[idx], quantity: next[idx].quantity + quantity, price: livePrice };
            } else {
                next = [...prev, {
                    productId: product._id,
                    name: product.name,
                    image: product.image,
                    price: livePrice,
                    basePrice: product.price,
                    unit: product.unit,
                    quantity,
                    vendor: typeof product.vendor === 'object' ? product.vendor._id : product.vendor,
                    vendorName: product.vendor?.name,
                    negotiationId: negotiation?._id,
                    prebookEnabled: !!product.prebook?.enabled,
                    prebookDiscountPercent: product.prebook?.discountPercent || 0,
                    pricingSchemeEnabled: !!product.pricingScheme?.enabled
                }];
            }
            localStorage.setItem(KEY, JSON.stringify(next));
            return next;
        });
    }, []);

    const update = useCallback((productId, quantity) => {
        setItems(prev => {
            const next = prev.map(i => i.productId === productId ? { ...i, quantity } : i).filter(i => i.quantity > 0);
            localStorage.setItem(KEY, JSON.stringify(next));
            return next;
        });
    }, []);

    const remove = useCallback((productId) => {
        setItems(prev => {
            const next = prev.filter(i => i.productId !== productId);
            localStorage.setItem(KEY, JSON.stringify(next));
            return next;
        });
    }, []);

    const clear = useCallback(() => persist([]), []);

    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const count = items.reduce((sum, i) => sum + i.quantity, 0);
    const vendorIds = [...new Set(items.map(i => i.vendor))];
    const multiVendor = vendorIds.length > 1;

    return (
        <CartContext.Provider value={{ items, add, update, remove, clear, total, count, multiVendor, vendorIds }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);
