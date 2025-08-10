// src/pages/ProfilePage.jsx

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiShield, FiActivity } from 'react-icons/fi';

const ProfilePage = () => {
    const { user } = useAuth();

    if (!user) {
        return <div className="text-center p-10">Loading profile...</div>;
    }

    return (
        <div className="bg-gray-50 flex items-center justify-center p-4 py-12">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full"
            >
                <div className="text-center">
                    <img
                        src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.username}`}
                        alt="avatar"
                        className="w-24 h-24 mx-auto rounded-full border-4 border-indigo-200"
                    />
                    <h1 className="text-3xl font-bold text-gray-800 mt-4">{user.username}</h1>
                    <p className="text-gray-500 capitalize">{user.role}</p>
                </div>
                <div className="mt-8 text-left space-y-4">
                    <div className="flex items-center text-lg">
                        <FiMail className="text-indigo-500 mr-4" />
                        <span className="text-gray-700">{user.email}</span>
                    </div>
                    <div className="flex items-center text-lg">
                        <FiShield className="text-indigo-500 mr-4" />
                        <span className="text-gray-700 capitalize">{user.role} Privileges</span>
                    </div>
                    <div className="flex items-center text-lg">
                        <FiActivity className="text-indigo-500 mr-4" />
                        <span className="text-gray-700 capitalize">Status: <span className="font-semibold text-green-600">{user.status}</span></span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default ProfilePage;