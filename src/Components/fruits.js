import React, { useState, useEffect } from 'react';
import './fruits.css';
import { motion } from 'framer-motion';
import ProductDialog from "./ProductDialog";

export default function Fruits() {
    const [selectedFruit, setSelectedFruit] = useState(null);
    const [fruitsData, setFruitsData] = useState([]);

    useEffect(() => {
        fetch('http://localhost:4000/api/products?category=fruit')
            .then(res => res.json())
            .then(data => setFruitsData(data));
    }, []);

    const cardVariants = {
        hidden: { opacity: 0, y: 50 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <>
            <motion.div
                className="fruits-container"
                initial="hidden"
                animate="visible"
                transition={{ staggerChildren: 0.2 }}
            >
                {fruitsData.map((fruit) => (
                    <motion.div
                        className="fruit-card"
                        key={fruit._id}
                        variants={cardVariants}
                        transition={{ duration: 0.5 }}
                        whileHover={{ scale: 1.05 }}
                    >
                        <img src={fruit.image || 'https://via.placeholder.com/150'} alt={fruit.name} className="fruit-image" />
                        <div className="fruit-details">
                            <h4 className="clickable-name" onClick={() => setSelectedFruit(fruit)}>
                                {fruit.name}
                            </h4>
                            <p>{fruit.description}</p>
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            <ProductDialog
                fruit={selectedFruit}
                open={Boolean(selectedFruit)}
                onClose={() => setSelectedFruit(null)}
            />
        </>
    );
}
