// src/pages/RegisterPage.jsx

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiLock, FiKey } from 'react-icons/fi';

const API_URL = 'http://localhost:4002/api/auth'; // Your backend URL

const RegisterPage = () => {
    const [step, setStep] = useState(1); // 1 for details, 2 for verification
    const [formData, setFormData] = useState({ username: '', email: '', password: '' });
    const [verificationCode, setVerificationCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Step 1: Send user details to get verification code
    const handleRegistrationRequest = async (e) => {
        e.preventDefault();
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }
        setLoading(true);
        setError('');
        setMessage('');
        try {
            const res = await axios.post(`${API_URL}/send-verification`, formData);
            setMessage(res.data.message);
            setStep(2); // Move to verification step
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send verification code.');
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Send verification code to complete registration
    const handleVerificationSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await axios.post(`${API_URL}/verify-register`, {
                email: formData.email,
                code: verificationCode,
            });
            setMessage(res.data.message);
            const userId = res.data.user.id;
            setTimeout(() => {
                navigate(`/waiting-for-approval/${userId}`);
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Verification failed.');
        } finally {
            setLoading(false);
        }
    };

    const renderStepOne = () => (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <span className="mb-3 text-4xl font-bold">Create Account</span>
            <br/>
            <span className="font-light text-gray-400 mb-5">Get started with a verified email!</span>
            <form onSubmit={handleRegistrationRequest}>
                <div className="relative flex items-center mb-4 mt-3">
                    <FiUser className="absolute ml-3 text-gray-400" />
                    <input type="text" name="username" value={formData.username} onChange={handleChange} placeholder="Username" required className="w-full p-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="relative flex items-center mb-4">
                    <FiMail className="absolute ml-3 text-gray-400" />
                    <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email" required className="w-full p-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="relative flex items-center mb-6">
                    <FiLock className="absolute ml-3 text-gray-400" />
                    <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Password (min. 6 characters)" required className="w-full p-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-3 rounded-lg mb-6 hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 disabled:opacity-50 flex items-center justify-center">
                    {loading ? <div className="w-5 h-5 border-t-2 border-white border-solid rounded-full animate-spin"></div> : 'Send Verification Code'}
                </button>
            </form>
        </motion.div>
    );

    const renderStepTwo = () => (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <span className="mb-3 text-4xl font-bold">Verify Your Email</span>
            <span className="font-light text-gray-400 mb-8">{message}</span>
            <form onSubmit={handleVerificationSubmit}>
                <div className="relative flex items-center mb-6">
                    <FiKey className="absolute ml-3 text-gray-400" />
                    <input type="text" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} placeholder="6-Digit Code" required maxLength="6" className="w-full p-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white p-3 rounded-lg mb-6 hover:from-green-600 hover:to-emerald-700 transition-all duration-300 disabled:opacity-50 flex items-center justify-center">
                    {loading ? <div className="w-5 h-5 border-t-2 border-white border-solid rounded-full animate-spin"></div> : 'Verify & Complete Registration'}
                </button>
            </form>
        </motion.div>
    );

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="relative flex flex-col m-6 space-y-8 bg-white shadow-2xl rounded-2xl md:flex-row md:space-y-0">
                {/* Image Side */}
                <motion.div className="relative" initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
                    <img src="https://images.unsplash.com/photo-1487017159836-4e23ece2e4cf?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1171&q=80" alt="img" className="w-[400px] h-full hidden rounded-l-2xl md:block object-cover" />
                </motion.div>
                {/* Form Side */}
                <div className="flex flex-col justify-center p-8 md:p-14 w-[450px]">
                    {step === 1 ? renderStepOne() : renderStepTwo()}
                    {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
                    <div className="text-center text-gray-400 mt-6">
                        Already have an account?
                        <Link to="/login" className="font-bold text-blue-600 hover:underline ml-2">Log in</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;