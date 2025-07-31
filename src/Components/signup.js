import React, { useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import './auth.css';
import { MyContext } from "../App";

export default function Signup() {
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
                <h2 className="text-center mb-4">Create an Account</h2>
                <form>
                    <div className="mb-3">
                        <label>Full Name</label>
                        <input type="text" className="form-control" placeholder="John Doe" />
                    </div>
                    <div className="mb-3">
                        <label>Email</label>
                        <input type="email" className="form-control" placeholder="you@example.com" />
                    </div>
                    <div className="mb-3">
                        <label>Password</label>
                        <input type="password" className="form-control" placeholder="••••••••" />
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
