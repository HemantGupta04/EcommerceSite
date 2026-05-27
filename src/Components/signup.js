import React, { useEffect, useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './auth.css';
import { MyContext } from "../App";

export default function Signup() {
    const context = useContext(MyContext);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('customer');
    const [mobile, setMobile] = useState('');
    const [location, setLocation] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (context?.setisheaderfootershow) {
            context.setisheaderfootershow(false);
        }

        // Get location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                (err) => console.log(err)
            );
        }

        return () => {
            if (context?.setisheaderfootershow) {
                context.setisheaderfootershow(true);
            }
        };
    }, [context]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:4000/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, role, mobile, location })
            });
            const data = await res.json();
            if (res.ok) {
                alert('Account created');
                navigate('/login');
            } else {
                alert(data.error);
            }
        } catch (err) {
            alert('Signup failed');
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-image"></div>
            <div className="auth-form">
                <h2 className="text-center mb-4">Create an Account</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label>Full Name</label>
                        <input type="text" className="form-control" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" required />
                    </div>
                    <div className="mb-3">
                        <label>Email</label>
                        <input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
                    </div>
                    <div className="mb-3">
                        <label>Password</label>
                        <input type="password" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
                    </div>
                    <div className="mb-3">
                        <label>Role</label>
                        <select className="form-control" value={role} onChange={(e) => setRole(e.target.value)}>
                            <option value="customer">Customer</option>
                            <option value="vendor">Vendor</option>
                        </select>
                    </div>
                    <div className="mb-3">
                        <label>Mobile</label>
                        <input type="text" className="form-control" value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="1234567890" />
                    </div>
                    <button type="submit" className="btn btn-dark w-100">Sign Up</button>
                </form>
                <p className="text-center mt-3">
                    Already have an account? <Link to="/login">Sign in</Link>
                </p>
            </div>
        </div>
    );
}
