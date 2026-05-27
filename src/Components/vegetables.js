import React, { useState, useEffect } from 'react'
import './vegetables.css';
import { motion } from 'framer-motion';
import ProductDialog from "./ProductDialog";

export default function Vegetable() {
    const [selectedVeg, setSelectedVeg] = useState(null);
    const [vegetablesData, setVegetablesData] = useState([]);

    useEffect(() => {
        fetch('http://localhost:4000/api/products?category=vegetable')
            .then(res => res.json())
            .then(data => setVegetablesData(data));
    }, []);

    const cardVariants = {
        hidden: { opacity: 0, y: 50 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <>
            <motion.div
                className="vegetable-container"
                initial="hidden"
                animate="visible"
                transition={{ staggerChildren: 0.2 }}
            >
                {vegetablesData.map((vegetable) => (
                    <motion.div
                        className="vegetable-card"
                        key={vegetable._id}
                        variants={cardVariants}
                        transition={{ duration: 0.5 }}
                        whileHover={{ scale: 1.05 }}
                    >
                        <img src={vegetable.image || 'https://via.placeholder.com/150'} alt={vegetable.name} className="vegetable-image" />
                        <div className="vegetable-details">
                            <h4 onClick={() => setSelectedVeg(vegetable)}>{vegetable.name}</h4>
                            <p>{vegetable.description}</p>
                        </div>
                    </motion.div>
                ))}
            </motion.div>
            <ProductDialog
                fruit={selectedVeg}
                open={Boolean(selectedVeg)}
                onClose={() => setSelectedVeg(null)}
            />
        </>
    );
}
