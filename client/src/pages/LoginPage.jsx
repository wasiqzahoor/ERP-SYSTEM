// src/pages/LoginPage.jsx

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiEye, FiEyeOff, FiKey } from 'react-icons/fi';
import { toast } from 'react-toastify'; 
const LoginPage = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // --- 2FA ke liye Nayi States ---
    const [twoFactorRequired, setTwoFactorRequired] = useState(false);
    const [twoFactorToken, setTwoFactorToken] = useState('');

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        try {
            const response = await login(formData.email, formData.password, twoFactorToken);
            
            if (response.twoFactorRequired) {
                setTwoFactorRequired(true);
            } else {
                const loggedInUser = response.user;
                if (loggedInUser.isSuperAdmin) {
                    navigate('/superadmin/dashboard');
                } else {
                    navigate('/dashboard');
                }
            }
        } catch (err) {
            toast.error(err.message || 'Login failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="relative flex flex-col m-6 space-y-8 bg-white shadow-2xl rounded-2xl md:flex-row md:space-y-0">
                
                <motion.div 
                    className="flex flex-col justify-center p-8 md:p-14"
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <span className="mb-3 text-4xl font-bold">
                        {twoFactorRequired ? "Two-Factor Verification" : "Welcome back"}
                    </span>
                    <span className="font-light text-gray-400 mb-8">
                        {twoFactorRequired 
                            ? "Enter the code from your authenticator app." 
                            : "Welcome back! Please enter your details"}
                    </span>

                    <form onSubmit={handleSubmit}>
                        {!twoFactorRequired && (
                            <>
                                <div className="relative flex items-center mb-4">
                                   <FiMail className="absolute ml-3 text-gray-400" />
                                   <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="Enter your email"
                                        required
                                        className="w-full p-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="relative flex items-center mb-2">
                                    <FiLock className="absolute ml-3 text-gray-400" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="Enter your password"
                                        required
                                        className="w-full p-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 text-gray-500 focus:outline-none">
                                        {showPassword ? <FiEyeOff /> : <FiEye />}
                                    </button>
                                </div>
                                <div className="flex justify-end text-sm mb-2">
                                    <Link to="/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-500">
                                        Forgot Password?
                                    </Link>
                                </div>
                            </>
                        )}
                        
                        {twoFactorRequired && (
                            <div className="relative flex items-center mb-4">
                               <FiKey className="absolute ml-3 text-gray-400" />
                               <input
                                    type="text"
                                    maxLength="6"
                                    value={twoFactorToken}
                                    onChange={(e) => setTwoFactorToken(e.target.value)}
                                    placeholder="6-Digit Code"
                                    required
                                    className="w-full p-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                />
                            </div>
                        )}

                        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
                        
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-3 rounded-lg mb-6 hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 disabled:opacity-50 flex items-center justify-center"
                        >
                            {loading ? <div className="w-5 h-5 border-t-2 border-white border-solid rounded-full animate-spin"></div> : (twoFactorRequired ? 'Verify Code' : 'Log In')}
                        </button>
                    </form>

                     
                </motion.div>

                <motion.div 
                    className="relative"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <img
                        src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80"
                        alt="img"
                        className="w-[400px] h-full hidden rounded-r-2xl md:block object-cover"
                    />
                </motion.div>
            </div>
        </div>
    );
};

export default LoginPage;