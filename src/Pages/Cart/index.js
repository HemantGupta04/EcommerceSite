import React, { useContext, useState } from 'react';
import './Cart.css';
import { FaTrash } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { MyContext } from '../../App';

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
    const { cart, setCart, user } = useContext(MyContext);
    const [customerMobile, setCustomerMobile] = useState(user?.mobile || '');
    const [customerLocation, setCustomerLocation] = useState(null);

    const subtotal = cart.reduce((acc, item) => acc + item.quantity * item.price, 0);

    const updateQuantity = (id, qty) =>
        setCart(items => items.map(item => item._id === id ? { ...item, quantity: qty } : item));

    const removeItem = (id) => setCart(items => items.filter(item => item._id !== id));

    const getLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setCustomerLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                (err) => alert('Location access denied')
            );
        }
    };

    const placeOrder = async () => {
        if (!customerMobile || !customerLocation) {
            alert('Please provide mobile and location');
            return;
        }
        const items = cart.map(item => ({
            product: item._id,
            quantity: item.quantity,
            price: item.price
        }));
        const order = { items, total: subtotal, customerMobile, customerLocation };
        const res = await fetch('http://localhost:4000/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(order)
        });
        if (res.ok) {
            alert('Order placed');
            setCart([]);
        } else {
            alert('Order failed');
        }
    };

    return (
        <div className="cart-container">
            <motion.div className="cart-items" initial={{ x: -40, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
                <h2 className="cart-title">There are {cart.length} products in your cart</h2>
                {cart.map(item => (
                    <motion.div
                        key={item._id}
                        className="cart-item"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="item-left">
                            <img src={item.image || 'https://via.placeholder.com/150'} alt={item.name} className="item-image" />
                            <div>
                                <h4 className="item-name">{item.name}</h4>
                                <p className="item-qty">Quantity: {item.quantity}</p>
                            </div>
                        </div>
                        <QuantityDrop value={item.quantity} onChange={(qty) => updateQuantity(item._id, qty)} />
                        <div className="item-total">₹{(item.price * item.quantity)}</div>
                        <button className="remove-btn" onClick={() => removeItem(item._id)}>
                            <FaTrash />
                        </button>
                    </motion.div>
                ))}
            </motion.div>

            <motion.div className="cart-summary" initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
                <h3>Summary</h3>
                <div className="summary-line"><span>Subtotal</span><span>₹{subtotal}</span></div>
                <div className="summary-line"><span>Shipping</span><span>Free</span></div>
                <div className="summary-line"><span>Estimate for</span><span>India</span></div>
                <div className="summary-line total"><span>Total</span><span>₹{subtotal}</span></div>
                <input type="text" placeholder="Mobile Number" value={customerMobile} onChange={(e) => setCustomerMobile(e.target.value)} />
                <button onClick={getLocation}>Get Location</button>
                <button className="checkout-btn" onClick={placeOrder}>Place Order</button>
            </motion.div>
        </div>
    );
};

export default Cart;
