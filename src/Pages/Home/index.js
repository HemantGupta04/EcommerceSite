import React from 'react'
import HomeBanner from "./HomeBanner/index"
import img1 from "../../assets/images.jpeg";
import img2 from "../../assets/images2.jpeg";
import img3 from "../../assets/logo.jpeg";
import { motion } from 'framer-motion';


export default function Index() {
    return (
        <>
            <HomeBanner />
            <motion.div
                style={{ maxWidth: 900, margin: "auto", padding: "20px" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
            >
            <div style={{ maxWidth: 900, margin: "auto", padding: "20px" }}>

                <Section
                    text={
                        <>
                            Our app is designed to bring the freshest, handpicked fruits and vegetables right to your doorstep with just a few taps.
                            We connect local farmers and trusted suppliers directly to customers, ensuring top-quality produce that is healthy,
                            affordable, and sustainably sourced. Whether you’re looking for everyday staples or exotic seasonal delights,
                            our app makes shopping simple, convenient, and enjoyable.
                        </>
                    }
                    imgSrc={img1}
                    imgAlt="Fresh Fruits and Vegetables"
                    reverse={false}
                />

                <Section
                    text={
                        <>
                            With an intuitive and user-friendly interface, our app offers seamless browsing, detailed product information,
                            and secure payment options. Real-time order tracking and reliable delivery services ensure that your fresh produce
                            arrives quickly and in perfect condition. Our goal is to revolutionize the way you shop for groceries by combining
                            technology with farm-fresh goodness.
                        </>
                    }
                    imgSrc={img2}
                    imgAlt="User Interface"
                    reverse={true}
                />

                <Section
                    text={
                        <>
                            Beyond just shopping, our app empowers users with tips on storage, recipes, and nutrition, helping you make the most
                            out of every purchase. We are committed to supporting sustainable farming practices, reducing food waste,
                            and promoting healthier lifestyles — all while offering an unmatched shopping experience tailored to your needs.
                        </>
                    }
                    imgSrc={img3}
                    imgAlt="Healthy Lifestyle"
                    reverse={false}
                />
            </div>
            </motion.div>
        </>
    );
}
function Section({ text, imgSrc, imgAlt, reverse }) {
    return (
        <div
            style={{
                display: "flex",
                flexDirection: reverse ? "row-reverse" : "row",
                alignItems: "center",
                gap: 20,
                marginBottom: 40,
                flexWrap: "wrap",
            }}
        >

            <motion.div
                style={{ flex: "1 1 300px", minWidth: 280, fontSize: 16, lineHeight: 1.5 }}
                initial={{ opacity: 0, x: reverse ? -100 : 100 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 2 }}
            >
                <p>{text}</p>
            </motion.div>


            <motion.div
                style={{ flex: "1 1 300px", minWidth: 280 }}
                initial={{ x: reverse ? 100 : -100, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 1 }}
            >
                <motion.img
                    src={imgSrc}
                    alt={imgAlt}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    style={{
                        width: "100%",
                        height: "auto",
                        borderRadius: 8,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                    }}
                />
            </motion.div>
        </div>
    );
}