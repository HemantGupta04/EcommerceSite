import React from 'react'

export default function fruitModel() {
    return (
        <div>
            <motion.div
                className="fruit-modal"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
            >
                <div className="modal-content">
                    <span className="close-button" onClick={() => setSelectedFruit(null)}>×</span>
                    <img src={selectedFruit.img} alt={selectedFruit.name} />
                    <h2>{selectedFruit.name}</h2>
                    <p>{selectedFruit.description}</p>
                    <button className="buy-button">Buy Now</button>
                </div>
            </motion.div>
        </div>
    )
}
