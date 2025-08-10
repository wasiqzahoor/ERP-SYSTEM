// src/pages/RequestsPage.jsx

import React, { useState, useEffect } from 'react';
import api from '../api'; 
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUser, FiCheckCircle, FiXCircle } from 'react-icons/fi';

const RequestsPage = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/users/pending');
            setRequests(res.data?.users || []);
        } catch (error) {
            console.error('Failed to fetch requests', error);
            setRequests([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleStatusChange = async (userId, newStatus) => {
        setRequests(prev => prev.filter(req => req._id !== userId));
        try {
            await api.put(`/api/users/${userId}/status`, { status: newStatus });
        } catch (error) {
            console.error(`Failed to update status to ${newStatus}`, error);
            fetchRequests(); // Revert UI on error
        }
    };

    if (loading) {
        return <div className="text-center p-10">Loading Requests...</div>;
    }

    return (
        <div className="bg-gray-100 min-h-screen p-4 sm:p-6 md:p-8">
            <div className="container mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-800">User Requests</h1>
                    <p className="text-gray-500 mt-1">Review and approve new employee registrations.</p>
                </div>

                {/* Main Content Area */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <AnimatePresence>
                        {requests.length === 0 ? (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center p-12">
                                <FiCheckCircle className="mx-auto text-5xl text-green-500 mb-4" />
                                <h2 className="text-2xl font-semibold text-gray-700">All Clear!</h2>
                                <p className="text-gray-500 mt-2">There are no pending user requests at the moment.</p>
                            </motion.div>
                        ) : (
                            <table className="w-full text-sm text-left text-gray-600">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-4">User</th>
                                        <th scope="col" className="px-6 py-4">Registered On</th>
                                        <th scope="col" className="px-6 py-4 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {requests.map((req) => (
                                        <motion.tr
                                            key={req._id}
                                            layout
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0, x: -50 }}
                                            className="bg-white border-b hover:bg-gray-50 transition-colors duration-200"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-3">
                                                    <img 
                                                        className="w-10 h-10 rounded-full" 
                                                        src={`https://api.dicebear.com/7.x/initials/svg?seed=${req.username}`} 
                                                        alt={`${req.username} avatar`}
                                                    />
                                                    <div>
                                                        <div className="font-semibold text-gray-900">{req.username}</div>
                                                        <div className="text-gray-500">{req.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {new Date(req.createdAt).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center space-x-3">
                                                    <button 
                                                        onClick={() => handleStatusChange(req._id, 'active')}
                                                        className="font-medium text-green-600 hover:text-green-800 transition-colors flex items-center space-x-1"
                                                        title="Approve User"
                                                    >
                                                        <FiCheckCircle />
                                                        <span>Approve</span>
                                                    </button>
                                                    <button 
                                                        onClick={() => handleStatusChange(req._id, 'terminated')}
                                                        className="font-medium text-red-600 hover:text-red-800 transition-colors flex items-center space-x-1"
                                                        title="Reject User"
                                                    >
                                                        <FiXCircle />
                                                        <span>Reject</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default RequestsPage;