// client/src/context/AuthContext.jsx

import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const API_URL = 'http://localhost:4002/api/auth'; // <-- Make sure your backend port is correct

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');

        if (storedUser && storedToken) {
            setUser(JSON.parse(storedUser));
            setToken(storedToken);
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const res = await axios.post(`${API_URL}/login`, { email, password });
            const { user: userData, token: userToken } = res.data;

            if (userData.status !== 'active') {
                throw new Error(`Account is ${userData.status}. Please contact an administrator.`);
            }

            localStorage.setItem('user', JSON.stringify(userData));
            localStorage.setItem('token', userToken);
            setUser(userData);
            setToken(userToken);
            return res.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Login failed. Please check your credentials.');
        }
    };

    // <-- ADDED: Register Function -->
    const register = async (username, email, password) => {
        try {
            const res = await axios.post(`${API_URL}/register`, { username, email, password });
            // Register hone ke baad user ko login nahi karwana, sirf message dikhana hai
            return res.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Registration failed.');
        }
    };

    const logout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setUser(null);
        setToken(null);
    };

    const value = {
        user,
        token,
        loading,
        login,
        register, // <-- EXPORTED
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};