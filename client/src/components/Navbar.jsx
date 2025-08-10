// src/components/Navbar.jsx

import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { AiFillNotification } from 'react-icons/ai';
import { FiUser, FiLogOut, FiUserPlus, FiGrid } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
    const { user, logout } = useAuth(); // token ki zaroorat nahi agar api interceptor hai
    const navigate = useNavigate();
    const [pendingCount, setPendingCount] = useState(0);
    const [isDropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Click outside handler
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef]);
    
    // Fetch pending count
    useEffect(() => {
        if (user && (user.role === 'admin' || user.role === 'manager')) {
            const fetchPendingCount = async () => {
                try {
                    const res = await api.get('/api/users/pending');
                    setPendingCount(res.data?.users?.length || 0);
                } catch (error) {
                    console.error('Failed to fetch pending requests count', error);
                    setPendingCount(0);
                }
            };
            fetchPendingCount();
            const interval = setInterval(fetchPendingCount, 30000);
            return () => clearInterval(interval);
        }
    }, [user]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navLinkStyles = ({ isActive }) => ({
        background: isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
    });

    return (
        // --- YAHAN 2 AHEM CHANGES HAIN ---
        // 1. Color ko bg-indigo-700 kiya gaya hai.
        // 2. z-index ko z-30 kiya gaya hai taake yeh sab se oopar rahe.
        <nav className="fixed top-0 left-0 right-0 bg-indigo-700 text-white shadow-lg z-50">
            
            {/* Smoke Animation Div */}
            <div className="absolute top-0 left-0 w-full h-full animate-smoke" style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)', width: '200%' }}></div>
            
            <div className="container mx-auto px-6 py-3 flex justify-between items-center relative z-10">
                <Link to="/dashboard" className="flex items-center space-x-2">
                    <img src="https://static.vecteezy.com/system/resources/thumbnails/046/593/914/small/creative-logo-design-for-real-estate-company-vector.jpg" alt="Logo" className="h-8 w-8" />
                    <span className="text-xl font-bold tracking-wider">ERP System</span>
                </Link>

                <div className="hidden md:flex items-center space-x-2">
                    <NavLink to="/dashboard" style={navLinkStyles} className="px-4 py-2 rounded-md text-sm font-medium transition-colors duration-300">Dashboard</NavLink>
                    {/* Placeholder links */}
                </div>

                <div className="flex items-center space-x-4">
                    {(user?.role === 'admin' || user?.role === 'manager') && (
                        <Link to="/requests" className="relative p-2 rounded-full hover:bg-indigo-600 transition-colors">
                            <AiFillNotification className="h-6 w-6" />
                            {pendingCount > 0 && (
                                <motion.span 
                                    animate={{ scale: [1, 1.2, 1] }} 
                                    transition={{ duration: 0.5, repeat: Infinity }}
                                    // --- BORDER COLOR THEEK KIYA GAYA HAI ---
                                    className="absolute top-0 right-0 h-5 w-5 bg-red-500 text-xs rounded-full flex items-center justify-center border-2 border-indigo-700">
                                    {pendingCount}
                                </motion.span>
                            )}
                        </Link>
                    )}

                    {/* Profile Dropdown Area */}
                    <div className="relative" ref={dropdownRef}>
                        <button onClick={() => setDropdownOpen(!isDropdownOpen)} className="flex items-center space-x-2 cursor-pointer p-1 rounded-full hover:bg-indigo-600">
                            <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.username}`} alt="avatar" className="h-8 w-8 rounded-full" />
                            <span className="hidden sm:block font-medium">{user?.username}</span>
                        </button>

                        <AnimatePresence>
                            {isDropdownOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute right-0 mt-2 w-60 bg-white rounded-lg shadow-xl py-1 z-50 text-gray-800"
                                >
                                    {/* Dropdown Header */}
                                    <div className="px-4 py-2 border-b border-gray-200">
                                        <p className="font-bold text-sm">{user.username}</p>
                                        <p className="text-xs text-gray-500">{user.email}</p>
                                    </div>
                                    
                                    {/* Dropdown Links */}
                                    <div className="py-1">
                                        <Link to="/profile" className="flex items-center px-4 py-2 text-sm hover:bg-indigo-50" onClick={() => setDropdownOpen(false)}>
                                            <FiGrid className="mr-3 text-gray-500" /> My Profile
                                        </Link>
                                        
                                        {user?.role === 'admin' && (
                                            <Link to="/add-manager" className="flex items-center px-4 py-2 text-sm hover:bg-indigo-50" onClick={() => setDropdownOpen(false)}>
                                                <FiUserPlus className="mr-3 text-gray-500" /> Add Manager
                                            </Link>
                                        )}
                                    </div>

                                    <div className="border-t border-gray-200"></div>
                                    
                                    <button onClick={handleLogout} className="w-full text-left flex items-center px-4 py-2 text-sm hover:bg-indigo-50 text-red-600">
                                        <FiLogOut className="mr-3" /> Logout
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;