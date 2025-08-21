// src/pages/RolesPage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { FiPlus, FiEdit, FiShield, FiChevronRight, FiChevronLeft } from 'react-icons/fi';
import { toast } from 'react-toastify';

const RolesPage = () => {
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const { hasPermission } = useAuth();

    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const res = await api.get(`/api/roles?page=${currentPage}&search=${searchTerm}`);
                setRoles(res.data.roles || res.data);
                setTotalPages(res.data.totalPages || 1);
            } catch (error) {
                console.error("Failed to fetch roles", error);
                toast.error('Failed to fetch roles');
            } finally {
                setLoading(false);
            }
        };
        fetchRoles();
    }, [currentPage, searchTerm]);

    // Function to handle search with debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            setCurrentPage(1);
            // Refetch data with search term
            const fetchRoles = async () => {
                try {
                    const res = await api.get(`/api/roles?page=1&search=${searchTerm}`);
                    setRoles(res.data.roles || res.data);
                    setTotalPages(res.data.totalPages || 1);
                } catch (error) {
                    console.error("Failed to fetch roles", error);
                    toast.error('Failed to fetch roles');
                }
            };
            fetchRoles();
        }, 500);
        
        return () => clearTimeout(timer);
    }, [searchTerm]);

    return (
        <div className="bg-gray-100 min-h-screen p-4 sm:p-6 md:p-8">
            <div className="container mx-auto">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">Role Management</h1>
                        <p className="text-gray-500 mt-1 text-sm sm:text-base">Manage and assign permissions to roles</p>
                    </div>
                    {hasPermission('role:create') && (
                        <Link to="/settings/roles/new" className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow hover:bg-indigo-700 w-full sm:w-auto justify-center">
                            <FiPlus /> Add New Role
                        </Link>
                    )}
                </div>

                {/* Search Box */}
                <div className="mb-4 bg-white p-3 sm:p-4 rounded-lg shadow-md">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search roles..."
                            className="w-full p-2 pl-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm sm:text-base"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <FiShield />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="p-3 sm:p-4 text-left">Role Name</th>
                                <th className="p-3 sm:p-4 text-left hidden sm:table-cell">Description</th>
                                <th className="p-3 sm:p-4 text-center">Permissions</th>
                                <th className="p-3 sm:p-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {loading ? (
                                <tr><td colSpan="4" className="text-center p-6">Loading...</td></tr>
                            ) : roles.length === 0 ? (
                                <tr><td colSpan="4" className="text-center p-6">
                                    {searchTerm ? 'No roles found matching your search' : 'No roles available'}
                                </td></tr>
                            ) : (
                                roles.map(role => (
                                    <tr key={role._id} className="hover:bg-gray-50">
                                        <td className="p-3 sm:p-4">
                                            <div className="font-bold text-gray-800 text-sm sm:text-base">{role.name}</div>
                                            <div className="text-xs text-gray-600 mt-1 sm:hidden">{role.description}</div>
                                        </td>
                                        <td className="p-3 sm:p-4 text-gray-600 hidden sm:table-cell">{role.description}</td>
                                        <td className="p-3 sm:p-4 text-center">
                                            <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                                {role.permissions.length}
                                            </span>
                                        </td>
                                        <td className="p-3 sm:p-4 text-center">
                                            <div className="flex justify-center items-center">
                                                {hasPermission('role:update') && (
                                                    <Link 
                                                        to={`/settings/roles/edit/${role._id}`} 
                                                        className="text-blue-500 hover:text-blue-700 p-1 sm:p-2"
                                                        title="Edit Role"
                                                    >
                                                        <FiEdit />
                                                    </Link>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <span className="text-sm text-gray-700">
                            Page {currentPage} of {totalPages}
                        </span>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                                disabled={currentPage === 1 || loading}
                                className="p-2 rounded-md hover:bg-gray-200 disabled:opacity-50"
                                aria-label="Previous page"
                            >
                                <FiChevronLeft />
                            </button>
                            <button 
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                                disabled={currentPage === totalPages || loading}
                                className="p-2 rounded-md hover:bg-gray-200 disabled:opacity-50"
                                aria-label="Next page"
                            >
                                <FiChevronRight />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RolesPage;