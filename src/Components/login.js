import React, { useContext, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './auth.css';
import { MyContext } from "../App";

export default function Login() {
    const context = useContext(MyContext);

    useEffect(() => {
        if (context?.setisheaderfootershow) {
            context.setisheaderfootershow(false);
        }

        return () => {
            if (context?.setisheaderfootershow) {
                context.setisheaderfootershow(true);
            }
        };
    }, [context]);

    return (
        <div className="auth-container">
            <div className="auth-image"></div>
            <div className="auth-form">
                <h2 className="text-center mb-4">Sign in to Your Account</h2>
                <button className="btn btn-outline-dark w-100 mb-3">
                    <img src="https://img.icons8.com/color/16/google-logo.png" alt="google" /> Sign in with Google
                </button>
                <div className="text-center mb-3">or sign in with email</div>
                <form>
                    <div className="mb-3">
                        <label>Email</label>
                        <input type="email" className="form-control" placeholder="you@example.com" />
                    </div>
                    <div className="mb-3">
                        <label>Password</label>
                        <input type="password" className="form-control" placeholder="••••••••" />
                    </div>
                    <div className="d-flex justify-content-between mb-3">
                        <div></div>
                        <a href="#" className="text-muted">Forgot?</a>
                    </div>
                    <button type="submit" className="btn btn-dark w-100">Sign In</button>
                </form>
                <p className="text-center mt-3">
                    Don’t have an account? <Link to="/signup">Sign up</Link>
                </p>
            </div>
        </div>
    );
}
