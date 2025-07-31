import React, { useState } from 'react';
import './Cart.css';
import { FaTrash } from 'react-icons/fa';
import { motion } from 'framer-motion';
import mango from '../../assets/orange.jpeg'
import apple from '../../assets/apple.jpeg'
import Potato from '../../assets/grape.webp'

const sampleProducts = [
    {
        id: 1,
        name: "Orange",
        price: 50,
        image: mango,
    },
    {
        id: 2,
        name: "Apple",
        price: 100,
        image: apple,
    },
    {
        id: 3,
        name: "Potato",
        price: 20,
        image: Potato,
    },
];

const QuantityDrop = ({ value, onChange }) => (
    <select className="quantity-select" value={value} onChange={(e) => onChange(Number(e.target.value))}>
        {[...Array(10)].map((_, i) => (
            <option key={i + 1} value={i + 1}>
                {i + 1}
            </option>
        ))}
    </select>
);

const Cart = () => {
    const [cartItems, setCartItems] = useState(sampleProducts.map(p => ({ ...p, quantity: 1 })));
    const subtotal = cartItems.reduce((acc, item) => acc + item.quantity * item.price, 0);

    const updateQuantity = (id, qty) =>
        setCartItems(items => items.map(item => item.id === id ? { ...item, quantity: qty } : item));

    const removeItem = (id) => setCartItems(items => items.filter(item => item.id !== id));

    return (
        <div className="cart-container">
            <motion.div className="cart-items" initial={{ x: -40, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
                <h2 className="cart-title">There are {cartItems.length} products in your cart</h2>
                {cartItems.map(item => (
                    <motion.div
                        key={item.id}
                        className="cart-item"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="item-left">
                            <img src={item.image} alt={item.name} className="item-image" />
                            <div>
                                <h4 className="item-name">{item.name}</h4>
                                <p className="item-qty">Quantity: {item.quantity}</p>
                            </div>
                        </div>
                        <QuantityDrop value={item.quantity} onChange={(qty) => updateQuantity(item.id, qty)} />
                        <div className="item-total">{(item.price * item.quantity).toFixed(1)} Ruppes</div>
                        <button className="remove-btn" onClick={() => removeItem(item.id)}>
                            <FaTrash />
                        </button>
                    </motion.div>
                ))}
            </motion.div>

            <motion.div className="cart-summary" initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
                <h3>Summary</h3>
                <div className="summary-line"><span>Subtotal</span><span>{subtotal.toFixed(1)} Ruppes</span></div>
                <div className="summary-line"><span>Shipping</span><span>Free</span></div>
                <div className="summary-line"><span>Estimate for</span><span>India</span></div>
                <div className="summary-line total"><span>Total</span><span>{subtotal.toFixed(1)} Ruppes</span></div>
                <button className="checkout-btn">Proceed To Checkout</button>
            </motion.div>
        </div>
    );
};

export default Cart;
