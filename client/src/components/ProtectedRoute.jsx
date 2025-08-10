// src/components/ProtectedRoute.jsx

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        // Initial loading state, show a spinner or nothing
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    if (!user) {
        // User is not authenticated, redirect to login page
        // 'replace' prevents going back to the protected page with the back button
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // User is authenticated, render the child component (e.g., Dashboard)
    return children;
};

export default ProtectedRoute;