// src/context/AuthContext.jsx

import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api';
import { io } from 'socket.io-client';

const AuthContext = createContext();
const socket = io(import.meta.env.VITE_API_BASE_URL, { autoConnect: false });

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [permissions, setPermissions] = useState(new Set());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUserFromStorage = async () => {
            if (token) {
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                try {
                    const profileRes = await api.get('/api/users/profile');
                    const fullUserData = profileRes.data;
                    
                    if (fullUserData.isSuperAdmin) {
                        delete api.defaults.headers.common['x-tenant-id'];
                    } else if (fullUserData.tenant) {
                        const tenantIdentifier = fullUserData.tenant.subdomain || fullUserData.tenant._id;
                        api.defaults.headers.common['x-tenant-id'] = tenantIdentifier;
                    }

                    setUser(fullUserData);
                    socket.connect();
                    
                    const perms = new Set();
                    if (fullUserData.roles && Array.isArray(fullUserData.roles)) {
                        fullUserData.roles.forEach(role => {
                            role.permissions?.forEach(p => perms.add(p.key));
                        });
                    }
                    setPermissions(perms);
                } catch (error) {
                    console.error("Session expired or invalid.", error);
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    localStorage.removeItem('permissions');
                    delete api.defaults.headers.common['Authorization'];
                    delete api.defaults.headers.common['x-tenant-id'];
                    setUser(null);
                    setToken(null);
                    setPermissions(new Set());
                    socket.disconnect();
                }
            }
            setLoading(false);
        };
        loadUserFromStorage();
    }, [token]);
    
    useEffect(() => {
        if (socket.connected && user && user.tenant && user.tenant._id) {
            if (user.isSuperAdmin) {
                socket.emit('join_super_admin_room'); 
            } else {
                socket.emit('join_tenant_room', user.tenant._id.toString());
            }
        }
    }, [user, socket.connected]);

    const login = async (email, password, twoFactorToken) => {
        try {
            const loginRes = await api.post('/api/auth/login', { email, password, twoFactorToken });
            
            if (loginRes.data.twoFactorRequired) {
                return { twoFactorRequired: true };
            }

            const { token: userToken } = loginRes.data;
            
            localStorage.setItem('token', userToken);
            api.defaults.headers.common['Authorization'] = `Bearer ${userToken}`;
            
            const profileRes = await api.get('/api/users/profile');
            const fullUserData = profileRes.data;

            if (fullUserData.isSuperAdmin) {
                delete api.defaults.headers.common['x-tenant-id'];
            } else if (fullUserData.tenant) {
                const tenantIdentifier = fullUserData.tenant.subdomain || fullUserData.tenant._id;
                api.defaults.headers.common['x-tenant-id'] = tenantIdentifier;
            }
            
            setUser(fullUserData);
            setToken(userToken);
            localStorage.setItem('user', JSON.stringify(fullUserData));
            socket.connect();
            
            const perms = new Set();
            if (fullUserData.roles && Array.isArray(fullUserData.roles)) {
                fullUserData.roles.forEach(role => {
                    role.permissions?.forEach(p => perms.add(p.key));
                });
            }
            setPermissions(perms);
localStorage.setItem('permissions', JSON.stringify(Array.from(perms)));

            return { user: fullUserData };

        } catch (error) {
            console.error('Login error:', error);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('permissions');
            delete api.defaults.headers.common['Authorization'];
            delete api.defaults.headers.common['x-tenant-id'];
            setUser(null);
            setToken(null);
            setPermissions(new Set());
            socket.disconnect();
            throw new Error(error.response?.data?.message || 'Login failed.');
        }
    };
    const loginWithToken = (newToken, tenantIdentifier) => {
        // Step 1: Set loading state to true to show a loading screen
        setLoading(true);

        // Step 2: Store the original Super Admin token in case we need to "return"
        const originalToken = localStorage.getItem('token');
        localStorage.setItem('superadmin_token', originalToken);

        // Step 3: Set the new impersonation token and headers
        localStorage.setItem('token', newToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        api.defaults.headers.common['x-tenant-id'] = tenantIdentifier;
        
        // Step 4: Update the token state. This is the KEY step.
        // This will trigger the main useEffect to run again, which will then call
        // loadUserFromStorage() with the new token, fetching the new admin's profile
        // and setting the new user state, all without ever setting the user to null.
        setToken(newToken);
    };

    const logout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('permissions');
        delete api.defaults.headers.common['Authorization'];
        delete api.defaults.headers.common['x-tenant-id'];
        
        setUser(null);
        setToken(null);
        setPermissions(new Set());
        socket.disconnect();
    };

    const updateUser = (newUserData) => {
        const updatedUser = { ...user, ...newUserData };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
    };

    const hasPermission = (key) => permissions.has(key);
    
    const value = { user, token, loading, permissions, login,loginWithToken, logout, updateUser, hasPermission, socket };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);