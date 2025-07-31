import React from "react";

export default function Footer() {
    return (
        <footer style={styles.footer}>
            <div style={styles.container}>
                <div style={styles.section}>
                    <h3 style={styles.title}>About Us</h3>
                    <p style={styles.text}>
                        Fresh Fruits & Veggies is committed to bringing you the best quality fresh produce directly from farms to your doorstep.
                    </p>
                </div>

                <div style={styles.section}>
                    <h3 style={styles.title}>Quick Links</h3>
                    <ul style={styles.list}>
                        <li><a href="/" style={styles.link}>Home</a></li>
                        <li><a href="/fruits" style={styles.link}>Fruit</a></li>
                        <li><a href="/vegetables" style={styles.link}>Vegetable</a></li>
                        <li><a href="/contact" style={styles.link}>Contact</a></li>
                    </ul>
                </div>

                <div style={styles.section}>
                    <h3 style={styles.title}>Contact</h3>
                    <p style={styles.text}>Email: heemantgupta2014@gmail.com</p>
                    <p style={styles.text}>Phone: +91 817 845 8001</p>
                    <p style={styles.text}>Address: Palam, New Delhi</p>
                </div>
            </div>

            <div style={styles.copyRight}>
                &copy; {new Date().getFullYear()} Fresh Fruits & Veggies. All rights reserved.
            </div>
        </footer>
    );
}

const styles = {
    footer: {
        backgroundColor: "#233a95", 
        color: "white",
        padding: "40px 20px 20px",
        fontFamily: "'Lato', sans-serif",
    },
    container: {
        maxWidth: 1100,
        margin: "auto",
        display: "flex",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "30px",
    },
    section: {
        flex: "1 1 250px",
        minWidth: 250,
    },
    title: {
        marginBottom: 15,
        fontSize: 18,
        fontWeight: 700,
    },
    text: {
        lineHeight: 1.6,
    },
    list: {
        listStyle: "none",
        paddingLeft: 0,
    },
    link: {
        color: "white",
        textDecoration: "none",
        display: "block",
        marginBottom: 10,
        transition: "color 0.3s ease",
    },
    copyRight: {
        marginTop: 30,
        borderTop: "1px solid #4459a8",
        paddingTop: 15,
        textAlign: "center",
        fontSize: 14,
        opacity: 0.8,
    }
};
