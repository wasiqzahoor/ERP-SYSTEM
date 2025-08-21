// src/pages/DepartmentsPage.jsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { FiPlus, FiBriefcase, FiTrash2 } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify'; 
// --- Local DepartmentModal Component ---
const DepartmentModal = ({ onClose, onSave }) => {
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/api/departments', { name });
            onSave(res.data);
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create department.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
                <h2 className="text-2xl font-bold mb-4">Add New Department</h2>
                <form onSubmit={handleSubmit}>
                    <label className="block mb-2 font-semibold">Department Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="w-full p-2 border rounded-md mb-4"
                    />
                    <div className="flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="bg-gray-200 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300">Cancel</button>
                        <button type="submit" disabled={loading} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-50">
                            {loading ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- Local ConfirmationModal Component ---
const ConfirmationModal = ({ title, message, onConfirm, onCancel, confirmText, confirmColor }) => {
    const colorClasses = {
        red: 'bg-red-600 hover:bg-red-700',
        indigo: 'bg-indigo-600 hover:bg-indigo-700',
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-sm text-center p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 mb-6">{message}</p>
                <div className="flex justify-center gap-4">
                    <button
                        onClick={onCancel}
                        className="px-6 py-2 rounded-lg font-semibold bg-gray-200 hover:bg-gray-300"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-6 py-2 rounded-lg font-semibold text-white ${colorClasses[confirmColor || 'indigo']}`}
                    >
                        {confirmText || 'Confirm'}
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- DepartmentsPage Main Component ---
const DepartmentsPage = () => {
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [departmentToDelete, setDepartmentToDelete] = useState(null);
    const { hasPermission } = useAuth();

    const fetchDepartments = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/departments');
            setDepartments(res.data);
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

    const handleSaveDepartment = (newDepartment) => {
        setDepartments(prev => [newDepartment, ...prev]);
    };
    
    const handleDelete = async () => {
        if (!departmentToDelete) return;
        try {
            await api.delete(`/api/departments/${departmentToDelete._id}`);
            setDepartments(prev => prev.filter(d => d._id !== departmentToDelete._id));
        } catch (error) {
            console.error("Failed to delete department", error);
            toast.error('Failed to delete department.');
        } finally {
            setDeleteModalOpen(false);
            setDepartmentToDelete(null);
        }
    };

    const openDeleteConfirmation = (dept) => {
        setDepartmentToDelete(dept);
        setDeleteModalOpen(true);
    };

    return (
        <div className="p-8 bg-gray-100 min-h-full">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-4xl font-bold text-gray-800">Departments</h1>
                {hasPermission('user:create') && (
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow hover:bg-indigo-700 transition-colors"
                    >
                        <FiPlus /> Add Department
                    </button>
                )}
            </div>
            
            {loading ? (
                <div className="text-center text-gray-500">Loading departments...</div>
            ) : departments.length === 0 ? (
                <div className="text-center text-gray-500 p-10 bg-white rounded-lg shadow">No departments found.</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {departments.map((dept, index) => (
                        <motion.div
                            key={dept._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="relative group bg-white p-6 rounded-lg shadow hover:shadow-xl transition-shadow h-full flex flex-col"
                        >
                            <Link to={`/departments/${dept._id}`} className="flex-grow">
                                <FiBriefcase className="text-4xl text-indigo-500 mb-4" />
                                <h2 className="text-xl font-bold text-gray-800">{dept.name}</h2>
                            </Link>

                            {hasPermission('user:delete') && (
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        openDeleteConfirmation(dept);
                                    }}
                                    className="absolute top-4 right-4 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Delete Department"
                                >
                                    <FiTrash2 size={18} />
                                </button>
                            )}
                        </motion.div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <DepartmentModal 
                    onClose={() => setIsModalOpen(false)} 
                    onSave={handleSaveDepartment} 
                />
            )}
            {isDeleteModalOpen && (
                <ConfirmationModal
                    title="Confirm Deletion"
                    message={`Are you sure you want to delete the "${departmentToDelete?.name}" department? All users will be unassigned from it.`}
                    onConfirm={handleDelete}
                    onCancel={() => setDeleteModalOpen(false)}
                    confirmText="Delete"
                    confirmColor="red"
                />
            )}
        </div>
    );
};

export default DepartmentsPage;