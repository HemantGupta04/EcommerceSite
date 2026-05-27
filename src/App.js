import React, { createContext, useState, useEffect } from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import Navbar from './Components/navbar.js';
import Footer from './Components/footer.js';
import Home from "./Pages/Home";
import Fruit from './Components/fruits.js';
import Vegetable from './Components/vegetables.js';
import Cart from './Pages/Cart/index.js';
import Login from './Components/login';
import Signup from './Components/signup';
import VendorDashboard from './Pages/VendorDashboard';

export const MyContext = createContext();

function App() {
  const [isheaderfootershow, setisheaderfootershow] = useState(true);
  const [islogin, setislogin] = useState(false);
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
      setislogin(true);
    }
  }, []);

  const value = {
    isheaderfootershow,
    setisheaderfootershow,
    islogin,
    setislogin,
    user,
    setUser,
    cart,
    setCart
  };

  return (
    <BrowserRouter>
      <MyContext.Provider value={value}>
        
        {isheaderfootershow && <Navbar />}

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/fruits" element={<Fruit />} />
          <Route path="/vegetables" element={<Vegetable />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/vendor" element={<VendorDashboard />} />
        </Routes>

        {isheaderfootershow && <Footer />}
      </MyContext.Provider>
    </BrowserRouter>
  );
}

export default App;
