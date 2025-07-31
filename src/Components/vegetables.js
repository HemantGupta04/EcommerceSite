import React from 'react'
import './vegetables.css';
import { motion } from 'framer-motion';
import LadyFinger from "../assets/apple.jpeg"
import Onion from "../assets/orange.jpeg"
import Potato from "../assets/grape.webp"
import Tomato from "../assets/apple.jpeg"
// import Vanshu from "../assets/vanshu.jpeg"

export default function vegetable() {
    const cardVariants = {
        hidden: { opacity: 0, y: 50 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <motion.div
            className="vegetable-container"
            initial="hidden"
            animate="visible"
            transition={{ staggerChildren: 0.2 }}
        >
            {[
                { name: "Lady-Finger", img: LadyFinger },
                { name: "Onion", img: Onion },
                { name: "Potato", img: Potato },
                { name: "Tomato", img: Tomato },
            ].map((vegetable, index) => (
                <motion.div
                    className="vegetable-card"
                    key={index}
                    variants={cardVariants}
                    transition={{ duration: 0.5 }}
                    whileHover={{ scale: 1.05 }}
                >
                    <img src={vegetable.img} alt={vegetable.name} className="vegetable-image" />
                    <div className="vegetable-details">
                        <h4 >{vegetable.name}</h4>
                        <p>Fresh and delicious {vegetable.name}s available now!</p>
                    </div>
                </motion.div>
            ))}
        </motion.div>
    );
}
