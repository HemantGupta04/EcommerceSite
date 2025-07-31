import React, { useState } from 'react';
import './fruits.css';
import { motion } from 'framer-motion';
import Apple from "../assets/apple.jpeg";
import Banana from "../assets/banana.jpeg";
import Orange from "../assets/orange.jpeg";
import Grape from "../assets/grape.webp";
import ProductDialog from "./ProductDialog";   

export default function Fruits() {
    const [selectedFruit, setSelectedFruit] = useState(null);

    const fruitsData = [
        { name: "Apple", img: Apple, description: "Red and juicy apples, great for health." },
        { name: "Banana", img: Banana, description: "Fresh bananas rich in potassium." },
        { name: "Orange", img: Orange, description: "Citrusy oranges, full of Vitamin C." },
        { name: "Grape", img: Grape, description: "Sweet seedless grapes for snacking." },
        { name: "Hurray", img: Grape, description: "Sample fruit for testing." },
    ];

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
                {fruitsData.map((fruit, index) => (
                    <motion.div
                        className="fruit-card"
                        key={index}
                        variants={cardVariants}
                        transition={{ duration: 0.5 }}
                        whileHover={{ scale: 1.05 }}
                    >
                        <img src={fruit.img} alt={fruit.name} className="fruit-image" />
                        <div className="fruit-details">
                            <h4 className="clickable-name" onClick={() => setSelectedFruit(fruit)}>
                                {fruit.name}
                            </h4>
                            <p>Fresh and delicious {fruit.name}s available now!</p>
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
