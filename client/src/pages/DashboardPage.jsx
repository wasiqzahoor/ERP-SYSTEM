// src/pages/DashboardPage.jsx

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const DashboardPage = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login'); // Redirect to login after logout
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-300">
            <div className="p-10 bg-white rounded-lg shadow-xl text-center">
                <h1 className="text-4xl font-bold mb-2">Welcome, {user?.username}!</h1>
                <p className="text-gray-600 mb-4">You are logged in as an <span className="font-semibold">{user?.role}</span>.</p>
                <p className="text-gray-500 mb-6">This is your main dashboard. More modules will be added here soon.</p>
                <button
                    onClick={handleLogout}
                    className="px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition"
                >
                    Logout
                </button>
            </div>
        </div>
    );
};

export default DashboardPage;