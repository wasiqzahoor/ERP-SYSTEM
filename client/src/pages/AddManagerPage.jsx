// src/pages/AddManagerPage.jsx

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiLock } from 'react-icons/fi';

const AddManagerPage = () => {
    const [formData, setFormData] = useState({ username: '', email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            // Data mein role: 'manager' shamil karein
            const managerData = { ...formData, role: 'manager' };
            const res = await api.post('/api/users/staff', managerData);
            setSuccess(res.data.message);
            setTimeout(() => {
                navigate('/dashboard'); // Admin ko dashboard par wapis bhej dein
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create manager.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white p-10 rounded-xl shadow-2xl w-full max-w-md"
            >
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold">Add New Manager</h1>
                    <p className="text-gray-500">Create an account with manager privileges.</p>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="relative flex items-center mb-4">
                        <FiUser className="absolute ml-3 text-gray-400" />
                        <input type="text" name="username" onChange={handleChange} placeholder="Username" required className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
                    </div>
                    <div className="relative flex items-center mb-4">
                        <FiMail className="absolute ml-3 text-gray-400" />
                        <input type="email" name="email" onChange={handleChange} placeholder="Email" required className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
                    </div>
                    <div className="relative flex items-center mb-6">
                        <FiLock className="absolute ml-3 text-gray-400" />
                        <input type="password" name="password" onChange={handleChange} placeholder="Temporary Password" required className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
                    </div>
                    
                    {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                    {success && <p className="text-green-500 text-sm mb-4">{success}</p>}
                    
                    <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-3 rounded-lg font-bold hover:from-indigo-700 transition-all duration-300 disabled:opacity-50 flex items-center justify-center">
                        {loading ? <div className="w-5 h-5 border-t-2 border-white border-solid rounded-full animate-spin"></div> : 'Create Manager Account'}
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export default AddManagerPage;