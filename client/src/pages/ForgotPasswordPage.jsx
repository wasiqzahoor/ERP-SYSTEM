// src/pages/ForgotPasswordPage.jsx

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { motion } from 'framer-motion';
import { FiMail, FiKey, FiLock } from 'react-icons/fi';
import { toast } from 'react-toastify'; 
const ForgotPasswordPage = () => {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [formData, setFormData] = useState({ code: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');
        try {
            const res = await api.post('/api/auth/forgot-password', { email });
            setMessage(res.data.message);
            setStep(2);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to send code.');
        } finally {
            setLoading(false);
        }
    };

    const handleResetSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (formData.password.length < 6) {
            toast.error('Password must be at least 6 characters long.');
            return;
        }
        setLoading(true);
        try {
            const res = await api.post('/api/auth/reset-password', { ...formData, email });
            setMessage(res.data.message);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Password reset failed.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-300">
            <div className="relative flex flex-col m-6 space-y-8 bg-white shadow-2xl rounded-2xl md:flex-row md:space-y-0">
               {/* left Side (Image) */}
                <motion.div 
                    className="relative"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <img
                        src="https://images.unsplash.com/photo-1554774853-719586f82d77?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80"
                        alt="Forgot password illustration"
                        className="w-[400px] h-full hidden rounded-l-2xl md:block object-cover"
                    />
                </motion.div>
                {/* Right Side (Form) */}
                <motion.div 
                    className="flex flex-col justify-center p-8 md:p-14"
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    {step === 1 ? (
                        <>
                            <span className="mb-3 text-4xl font-bold">Forgot Password?</span>
                            <span className="font-light text-gray-400 mb-8">No worries, we'll send you reset instructions.</span>
                            <form onSubmit={handleEmailSubmit}>
                                <div className="relative flex items-center mb-6">
                                    <FiMail className="absolute ml-3 text-gray-400" />
                                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your Email Address" required className="w-full p-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
                                </div>
                                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                                <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white p-3 rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50">
                                    {loading ? 'Sending...' : 'Send Reset Code'}
                                </button>
                            </form>
                        </>
                    ) : (
                        <>
                            <span className="mb-3 text-4xl font-bold">Reset Password</span>
                            <span className="font-light text-gray-400 mb-8">{message || 'Check your email for the reset code.'}</span>
                            <form onSubmit={handleResetSubmit}>
                                <div className="relative flex items-center mb-4">
                                    <FiKey className="absolute ml-3 text-gray-400" />
                                    <input type="text" name="code" value={formData.code} onChange={handleChange} placeholder="6-Digit Code" required className="w-full p-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
                                </div>
                                <div className="relative flex items-center mb-6">
                                    <FiLock className="absolute ml-3 text-gray-400" />
                                    <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="New Password (min. 6 characters)" required className="w-full p-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
                                </div>
                                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                                {message && !error && <p className="text-green-600 text-sm mb-4">{message}</p>}
                                <button type="submit" disabled={loading} className="w-full bg-green-600 text-white p-3 rounded-lg font-bold hover:bg-green-700 disabled:opacity-50">
                                    {loading ? 'Resetting...' : 'Reset Password'}
                                </button>
                            </form>
                        </>
                    )}
                     <div className="text-center text-gray-400 mt-6">
                        <Link to="/login" className="font-bold text-indigo-600 hover:underline">Back to Login</Link>
                    </div>
                </motion.div>

                
                

            </div>
        </div>
    );
};

export default ForgotPasswordPage;