import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { AiFillNotification } from 'react-icons/ai';
import { FiTrash2, FiMail } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const Notifications = () => {
    const { user, socket } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Click outside handler to close the dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Function to check if the user has a required role
    const userHasRole = (allowedRoles) => {
        if (!user || !user.roles) return false;
        return user.roles.some(role => allowedRoles.includes(role.name.toLowerCase()));
    };

    // Function to fetch notifications from the API
    const fetchNotifications = async () => {
        if (!user || user.isSuperAdmin || !userHasRole(['admin', 'manager'])) return;
        try {
            const res = await api.get('/api/notifications');
            setNotifications(res.data.notifications);
            setUnreadCount(res.data.unreadCount);
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        }
    };
    
    // Fetch notifications when the component mounts or the user changes
    useEffect(() => {
        fetchNotifications();
    }, [user]);

    // Set up the real-time listener for new notifications via Socket.io
    useEffect(() => {
        if (!socket || !user || user.isSuperAdmin || !userHasRole(['admin', 'manager'])) return;
        
        const handleNewNotification = (data) => {
            setUnreadCount(prev => prev + 1);
            setNotifications(prev => [{ ...data, isRead: false, createdAt: new Date() }, ...prev]);
        };

        // Listen for the specific event from the backend
        socket.on('new_user_request', handleNewNotification);

        // Clean up the listener when the component unmounts
        return () => {
            socket.off('new_user_request', handleNewNotification);
        };
    }, [socket, user]);

    const handleMarkAllAsRead = async () => {
        if (unreadCount === 0) return;
        try {
            await api.patch('/api/notifications/read-all');
            setUnreadCount(0);
            setNotifications(notifications.map(n => ({...n, isRead: true})));
        } catch(error) {
            console.error("Failed to mark all as read", error);
        }
    };
    
    const handleDeleteAll = async () => {
        if (notifications.length === 0) return;
        if (window.confirm("Are you sure you want to clear all notifications?")) {
            try {
                await api.delete('/api/notifications');
                setNotifications([]);
                setUnreadCount(0);
            } catch(error) {
                console.error("Failed to delete all notifications", error);
            }
        }
    };

    // Naya function: single notification ko read mark karne ke liye
    const handleNotificationClick = async (notification) => {
        if (notification.isRead) return;

        try {
            await api.patch(`/api/notifications/${notification._id}/read`);
            setUnreadCount(prev => (prev > 0 ? prev - 1 : 0));
            setNotifications(prev => 
                prev.map(n => 
                    n._id === notification._id ? { ...n, isRead: true } : n
                )
            );
        } catch (error) {
            console.error("Failed to mark notification as read", error);
        }
    };

    // Agar user Super Admin hai ya required role nahi hai, to component render na karein
    if (!user || user.isSuperAdmin || !userHasRole(['admin', 'manager'])) {
        return null; 
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button onClick={() => setIsOpen(o => !o)} className="relative p-2 rounded-full hover:bg-indigo-600">
                <AiFillNotification className="h-6 w-6" />
                {unreadCount > 0 && (
                    <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.5, repeat: Infinity }} className="absolute top-0 right-0 h-5 w-5 bg-red-500 text-xs rounded-full flex items-center justify-center border-2 border-indigo-700">{unreadCount}</motion.span>
                )}
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-xl z-50 text-gray-800">
                        <div className="p-3 flex justify-between items-center border-b">
                            <span className="font-bold">Notifications</span>
                            <div className="flex items-center space-x-2">
                               {unreadCount > 0 && <button onClick={handleMarkAllAsRead} className="text-xs text-blue-500 hover:underline">Mark all as read</button>}
                               {notifications.length > 0 && <button onClick={handleDeleteAll} title="Clear all notifications" className="text-red-500 hover:text-red-700"><FiTrash2 size={14}/></button>}
                            </div>
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                            {notifications.length > 0 ? notifications.map((notif) => (
                                <Link
                                    key={notif._id}
                                    to={notif.link || '#'}
                                    onMouseDown={() => handleNotificationClick(notif)}
                                    onClick={() => setIsOpen(false)}
                                    className={`block p-3 hover:bg-gray-100 border-b ${!notif.isRead ? 'bg-blue-50' : ''}`}
                                >
                                    <p className="text-sm">{notif.message}</p>
                                    <p className="text-xs text-gray-400 mt-1">{new Date(notif.createdAt).toLocaleString()}</p>
                                </Link>
                            )) : 
                            <div className="p-8 text-center text-gray-500">
                                <FiMail size={32} className="mx-auto mb-2"/>
                                <p>You have no notifications.</p>
                            </div>
                            }
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Notifications;