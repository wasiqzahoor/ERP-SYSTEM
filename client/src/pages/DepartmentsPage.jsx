// src/pages/DepartmentsPage.jsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { FiPlus, FiBriefcase, FiTrash2, FiEdit2, FiUsers, FiSearch, FiX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';

// Enhanced Department Modal with better styling
const DepartmentModal = ({ department, onClose, onSave }) => {
    const isEditMode = Boolean(department);
    const [name, setName] = useState(department?.name || '');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault(); 
        setLoading(true);
        try {
            let res;
            if (isEditMode) {
                res = await api.put(`/api/departments/${department._id}`, { name });
                toast.success("Department updated successfully!");
            } else {
                res = await api.post('/api/departments', { name });
                toast.success("Department created successfully!");
            }
            onSave(res.data);
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save department.');
        } finally { 
            setLoading(false); 
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md"
            >
                <h2 className="text-2xl font-bold mb-4 text-gray-800">
                    {isEditMode ? 'Edit Department' : 'Add New Department'}
                </h2>
                <form onSubmit={handleSubmit}>
                    <label className="block mb-2 font-medium text-gray-700">Department Name</label>
                    <input 
                        type="text" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        required 
                        className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-indigo-500 focus:border-transparent" 
                        placeholder="Enter department name"
                    />
                    <div className="flex justify-end gap-3">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="px-5 py-2.5 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={loading} 
                            className="px-5 py-2.5 rounded-lg font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Saving...
                                </>
                            ) : isEditMode ? 'Update Department' : 'Create Department'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

// Enhanced Confirmation Modal
const ConfirmationModal = ({ title, message, onConfirm, onCancel, confirmText = "Confirm", confirmColor = "red" }) => {
    const colorClasses = {
        red: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
        indigo: 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500',
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-xl shadow-xl w-full max-w-sm text-center p-6"
            >
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                    <FiTrash2 className="text-red-600 text-xl" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">{title}</h3>
                <p className="text-sm text-gray-600 mb-6">{message}</p>
                <div className="flex justify-center gap-3">
                    <button
                        onClick={onCancel}
                        className="px-5 py-2.5 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-5 py-2.5 rounded-lg font-medium text-white ${colorClasses[confirmColor]} transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2`}
                    >
                        {confirmText}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

const DepartmentsPage = () => {
    const [departments, setDepartments] = useState([]);
    const [filteredDepartments, setFilteredDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [modalState, setModalState] = useState({ isOpen: false, department: null });
    const [deleteModalState, setDeleteModalState] = useState({ isOpen: false, department: null });
    const { hasPermission } = useAuth();

    const fetchDepartments = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/departments');
            setDepartments(res.data);
            setFilteredDepartments(res.data);
        } catch (error) {
            console.error("Failed to fetch departments", error);
            toast.error('Failed to fetch departments');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { 
        fetchDepartments(); 
    }, []);

    // Filter departments based on search query
    useEffect(() => {
        if (searchQuery) {
            const filtered = departments.filter(dept => 
                dept.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredDepartments(filtered);
        } else {
            setFilteredDepartments(departments);
        }
    }, [searchQuery, departments]);

    const handleSaveDepartment = (savedDepartment) => {
        if (modalState.department) {
            // Edit mode
            setDepartments(prev => prev.map(d => d._id === savedDepartment._id ? savedDepartment : d));
        } else {
            // Add mode
            setDepartments(prev => [savedDepartment, ...prev]);
        }
    };
    
    const handleDelete = async () => {
        if (!deleteModalState.department) return;
        try {
            await api.delete(`/api/departments/${deleteModalState.department._id}`);
            setDepartments(prev => prev.filter(d => d._id !== deleteModalState.department._id));
            toast.success('Department deleted successfully');
        } catch (error) {
            console.error("Failed to delete department", error);
            toast.error('Failed to delete department.');
        } finally {
            setDeleteModalState({ isOpen: false, department: null });
        }
    };

    const openDeleteConfirmation = (dept) => setDeleteModalState({ isOpen: true, department: dept });

    const clearSearch = () => setSearchQuery('');

    return (
        <div className="p-4 md:p-6 lg:p-8 bg-gray-50 min-h-screen">
            <div className="container mx-auto">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800">Departments</h1>
                        <p className="text-gray-600 mt-1">Manage all departments in your organization</p>
                    </div>
                    
                    {hasPermission('user:create') && (
                        <button 
                            onClick={() => setModalState({ isOpen: true, department: null })} 
                            className="bg-indigo-600 text-white px-4 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 font-medium self-start md:self-center"
                        >
                            <FiPlus size={18} /> Add Department
                        </button>
                    )}
                </div>
                
                {/* Search Bar */}
                <div className="bg-white p-4 rounded-xl shadow-sm mb-6">
                    <div className="relative max-w-md">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FiSearch className="text-gray-400" />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-10 py-2.5 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            placeholder="Search departments..."
                        />
                        {searchQuery && (
                            <button
                                onClick={clearSearch}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            >
                                <FiX className="text-gray-400 hover:text-gray-600" />
                            </button>
                        )}
                    </div>
                </div>
                
                {/* Departments Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="bg-white p-5 rounded-xl shadow h-48 animate-pulse">
                                <div className="h-10 w-10 rounded-full bg-gray-200 mb-4"></div>
                                <div className="h-6 bg-gray-200 rounded mb-3"></div>
                                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                                <div className="flex -space-x-2 mt-6">
                                    {[...Array(4)].map((_, j) => (
                                        <div key={j} className="h-8 w-8 rounded-full bg-gray-200 border-2 border-white"></div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredDepartments.length === 0 ? (
                    <div className="text-center py-12 px-6 bg-white rounded-xl shadow">
                        <FiBriefcase className="mx-auto text-5xl text-gray-400 mb-4" />
                        <h2 className="text-xl font-semibold text-gray-700 mb-2">
                            {searchQuery ? 'No departments found' : 'No Departments Yet'}
                        </h2>
                        <p className="text-gray-500 mb-6">
                            {searchQuery ? 'Try a different search term' : 'Get started by creating your first department'}
                        </p>
                        {hasPermission('user:create') && !searchQuery && (
                            <button 
                                onClick={() => setModalState({ isOpen: true, department: null })} 
                                className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 font-medium mx-auto"
                            >
                                <FiPlus size={18} /> Create Department
                            </button>
                        )}
                        {searchQuery && (
                            <button 
                                onClick={clearSearch} 
                                className="bg-gray-200 text-gray-700 px-5 py-2.5 rounded-lg hover:bg-gray-300 transition-colors font-medium mx-auto"
                            >
                                Clear Search
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6">
                        <AnimatePresence>
                            {filteredDepartments.map((dept, index) => (
                                <motion.div
                                    key={dept._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="relative group bg-white p-5 rounded-xl shadow hover:shadow-lg transition-all duration-300 flex flex-col"
                                >
                                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        {hasPermission('user:update') && (
                                            <button 
                                                onClick={() => setModalState({ isOpen: true, department: dept })} 
                                                className="p-1.5 rounded-lg bg-white shadow-sm text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                                aria-label="Edit department"
                                            >
                                                <FiEdit2 size={16} />
                                            </button>
                                        )}
                                        {hasPermission('user:delete') && (
                                            <button 
                                                onClick={() => openDeleteConfirmation(dept)} 
                                                className="p-1.5 rounded-lg bg-white shadow-sm text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                aria-label="Delete department"
                                            >
                                                <FiTrash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                    
                                    <Link to={`/departments/${dept._id}`} className="flex-group">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center">
                                                <FiBriefcase className="text-xl text-indigo-600" />
                                            </div>
                                            <h2 className="text-lg font-bold text-gray-900 truncate">{dept.name}</h2>
                                        </div>
                                        
                                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                                            <FiUsers className="text-gray-400" /> 
                                            <span>{dept.userCount} Employee{dept.userCount !== 1 ? 's' : ''}</span>
                                        </div>
                                        
                                        {/* Avatar Stack */}
                                        <div className="flex items-center -space-x-2 mt-4">
                                            {dept.users && dept.users.slice(0, 5).map(user => (
                                                <img 
                                                    key={user._id} 
                                                    src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.username}`} 
                                                    alt={user.username} 
                                                    className="w-8 h-8 rounded-full border-2 border-white shadow-sm" 
                                                    title={user.username} 
                                                />
                                            ))}
                                            {dept.userCount > 5 && (
                                                <span className="flex items-center justify-center w-8 h-8 text-xs font-medium text-gray-700 bg-gray-200 border-2 border-white rounded-full shadow-sm">
                                                    +{dept.userCount - 5}
                                                </span>
                                            )}
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}

                {/* Modals */}
                <AnimatePresence>
                    {modalState.isOpen && (
                        <DepartmentModal 
                            department={modalState.department}
                            onClose={() => setModalState({ isOpen: false, department: null })} 
                            onSave={handleSaveDepartment} 
                        />
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {deleteModalState.isOpen && (
                        <ConfirmationModal
                            title="Delete Department"
                            message={`Are you sure you want to delete "${deleteModalState.department?.name}"? This action cannot be undone.`}
                            onConfirm={handleDelete}
                            onCancel={() => setDeleteModalState({ isOpen: false, department: null })}
                            confirmText="Delete Department"
                        />
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default DepartmentsPage;