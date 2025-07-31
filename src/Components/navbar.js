import React, { useContext } from 'react';
import { motion } from 'framer-motion';
import Logo from "../assets/logo.jpeg";
import { Link, useNavigate } from 'react-router-dom';
import { MdAccountCircle } from "react-icons/md";
import { Button } from 'react-bootstrap';
import { TiShoppingCart } from "react-icons/ti";
import { FaHome } from "react-icons/fa";
import { TiContacts } from "react-icons/ti";
import { GiFruitBowl, GiCabbage } from "react-icons/gi";
import { MyContext } from '../App';

export default function Navbar() {
  const navigate = useNavigate();
  const { islogin } = useContext(MyContext); 

  const goToCart = () => {
    navigate('/cart');
  };

  const goToLogin = () => {
    navigate('/login');
  };

  return (
    <motion.div
      className='NavbarWrapper'
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className='top-strip bg-blue'>
        <div className='container'>
          <p className='mb-0 mt-0 text-center'>
            Fresh, Handpicked <b>Fruits</b> & <b>Vegetables</b> Delivered to Your Doorstep — Just One Click Away!
          </p>
        </div>
      </div>

      <div className='Header'>
        <div className='container'>
          <div className='row'>
            <div className='logoWrapper d-flex align-items-center col-sm-3'>
              <Link to='/'>
                <img src={Logo} alt='logo' style={{ maxHeight: "50px", marginRight: "10px" }} />
              </Link>
              <div className='name fw-bold fs-5'>TrustMandi</div>
            </div>

            <div className='col-sm-9 d-flex align-items-center justify-content-between part2'>
              <div className='nav-links d-flex gap-4'>
                <Link to="/" className='nav-item nav-link-custom'><FaHome /> Home</Link>
                <Link to="/contact" className='nav-item nav-link-custom'><TiContacts /> Contact Us</Link>
                <Link to="/fruits" className='nav-item nav-link-custom'><GiFruitBowl /> Fruits</Link>
                <Link to="/vegetables" className='nav-item nav-link-custom'><GiCabbage /> Vegetables</Link>
              </div>

              <div className="user-account d-flex align-items-center gap-2">
                {islogin !== true ? (
                  <Button
                    onClick={goToLogin}
                    className="signin-btn"
                  >
                    Sign In
                  </Button>
                ) : (
                  <Button className="circle account-btn">
                    <MdAccountCircle />
                  </Button>
                )}
                <p className="cart-label mb-0" onClick={goToCart} style={{ cursor: 'pointer' }}>CART</p>
                <Button className="circle cart-btn" onClick={goToCart}><TiShoppingCart /></Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
