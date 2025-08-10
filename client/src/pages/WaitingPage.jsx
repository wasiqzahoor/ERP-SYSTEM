// src/pages/WaitingPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FiClock, FiCheckCircle } from 'react-icons/fi';

const API_URL = 'http://localhost:4002/api/auth';

const WaitingPage = () => {
    const { userId } = useParams(); // Get user ID from URL
    const [status, setStatus] = useState('pending');
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');

    // useCallback to memoize the function
    const checkStatus = useCallback(async () => {
        try {
            const res = await axios.get(`${API_URL}/status/${userId}`);
            setStatus(res.data.status);
            setUsername(res.data.username);
            if (res.data.status === 'active' || res.data.status === 'terminated') {
                // Stop polling if status is final
                return true; 
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Could not fetch status.');
            return true; // Stop polling on error
        }
        return false; // Continue polling
    }, [userId]);

    useEffect(() => {
        // Initial check on component mount
        checkStatus();

        // Set up polling every 5 seconds
        const intervalId = setInterval(async () => {
            const shouldStop = await checkStatus();
            if (shouldStop) {
                clearInterval(intervalId);
            }
        }, 5000); // Poll every 5 seconds

        // Cleanup function to clear interval when component unmounts
        return () => clearInterval(intervalId);
    }, [checkStatus]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="relative flex flex-col m-6 bg-white shadow-2xl rounded-2xl md:flex-row md:space-y-0">
                {/* Left Side (Dynamic Content) */}
                <motion.div 
                    className="flex flex-col justify-center items-center p-8 md:p-14 text-center"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.7 }}
                >
                    {status === 'pending' && (
                        <>
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            >
                                <FiClock className="text-7xl text-blue-500 mb-6" />
                            </motion.div>
                            <h1 className="text-3xl font-bold mb-3">Hi, {username || 'there'}!</h1>
                            <p className="text-gray-500 mb-2">Your registration is complete.</p>
                            <p className="font-semibold text-lg text-orange-500">Your account is pending approval.</p>
                            <p className="text-gray-400 mt-4">We've notified the administration. This page will automatically update once your account is activated.</p>
                        </>
                    )}

                    {status === 'active' && (
                         <motion.div initial={{scale: 0}} animate={{scale: 1}} transition={{type: 'spring', stiffness: 260, damping: 20}}>
                            <FiCheckCircle className="text-8xl text-green-500 mb-6 mx-auto" />
                            <h1 className="text-4xl font-bold text-green-600 mb-3">Approved!</h1>
                            <p className="text-gray-600 mb-6 text-lg">Congratulations, {username}! Your account is now active.</p>
                            <Link to="/login">
                                <button className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white p-3 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-300">
                                    Proceed to Login
                                </button>
                            </Link>
                        </motion.div>
                    )}

                    {(status === 'terminated' || status === 'inactive') && (
                        // Handle other statuses if needed
                         <div className="text-center">
                            <h1 className="text-3xl font-bold text-red-600 mb-3">Account Update</h1>
                             <p className="text-gray-600">There is an update regarding your account. Please contact support for more information.</p>
                         </div>
                    )}

                    {error && <p className="text-red-500 mt-4">{error}</p>}
                </motion.div>

                {/* Right Side (Image) */}
                <motion.div 
                    className="relative"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <img
                        src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80"
                        alt="img"
                        className="w-[400px] h-full hidden rounded-r-2xl md:block object-cover"
                    />
                </motion.div>
            </div>
        </div>
    );
};

export default WaitingPage;