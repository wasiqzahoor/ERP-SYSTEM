import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import { FiArrowLeft, FiEdit, FiUsers, FiMail, FiUser, FiBriefcase, FiMoreVertical, FiX, FiCheck } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';

const DepartmentDetailsPage = () => {
    const { id } = useParams();
    const [department, setDepartment] = useState(null);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userMenuOpen, setUserMenuOpen] = useState(null);

    const fetchDetails = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/api/departments/${id}`);
            setDepartment(res.data.department);
            
            // Ensure users is always an array and add unique keys if missing
            const usersWithKeys = (res.data.users || []).map((user, index) => ({
                ...user,
                // Create a unique key if _id is missing
                uniqueKey: user._id || `user-${index}-${Date.now()}`
            }));
            
            setUsers(usersWithKeys);
        } catch (error) {
            console.error("Failed to fetch department details", error);
            toast.error('Failed to load department details');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetails();
    }, [id]);

    const handleSaveChanges = async (userId, roles, overrides) => {
        try {
            await api.put(`/api/users/${userId}/permissions`, { roles, permissionOverrides: overrides });
            toast.success('Permissions updated successfully');
            fetchDetails();
        } catch (error) {
            toast.error('Failed to save permissions.');
        }
    };

    // User Permission Modal Component
    const UserPermissionModal = ({ user, onClose, onSave }) => {
        const [roles, setRoles] = useState(user.roles || []);
        const [overrides, setOverrides] = useState(user.permissionOverrides || []);
        const [saving, setSaving] = useState(false);

        const handleSubmit = async (e) => {
            e.preventDefault();
            setSaving(true);
            try {
                await onSave(user._id, roles, overrides);
                onClose();
            } catch (error) {
                console.error("Failed to save permissions", error);
            } finally {
                setSaving(false);
            }
        };

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-xl shadow-xl w-full max-w-md"
                >
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-800">Manage Permissions</h2>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                                <FiX size={20} />
                            </button>
                        </div>
                        
                        <div className="flex items-center gap-3 mb-6">
                            <img 
                                src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.username}`} 
                                alt={user.username}
                                className="w-12 h-12 rounded-full"
                            />
                            <div>
                                <h3 className="font-semibold text-gray-800">{user.username}</h3>
                                <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                        </div>
                        
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Roles</label>
                                <div className="space-y-2">
                                    {['Admin', 'Manager', 'Employee', 'Viewer'].map(role => (
                                        <label key={role} className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={roles.includes(role)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setRoles([...roles, role]);
                                                    } else {
                                                        setRoles(roles.filter(r => r !== role));
                                                    }
                                                }}
                                                className="rounded text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <span className="ml-2 text-sm text-gray-700">{role}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Special Permissions</label>
                                <div className="space-y-2">
                                    {['Edit', 'Delete', 'Create', 'Export'].map(perm => (
                                        <label key={perm} className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={overrides.includes(perm)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setOverrides([...overrides, perm]);
                                                    } else {
                                                        setOverrides(overrides.filter(p => p !== perm));
                                                    }
                                                }}
                                                className="rounded text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <span className="ml-2 text-sm text-gray-700">{perm}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                                >
                                    {saving ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <FiCheck size={16} />
                                            Save Changes
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </motion.div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
                <div className="container mx-auto">
                    <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-6"></div>
                    <div className="h-10 w-80 bg-gray-200 rounded animate-pulse mb-8"></div>
                    
                    <div className="bg-white rounded-xl shadow p-6">
                        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6"></div>
                        
                        {/* Skeleton rows */}
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex items-center justify-between py-4 border-b border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                                    <div>
                                        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
                                        <div className="h-3 w-40 bg-gray-200 rounded animate-pulse"></div>
                                    </div>
                                </div>
                                <div className="h-8 w-28 bg-gray-200 rounded animate-pulse"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (!department) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-800 mb-4">Department Not Found</h1>
                    <Link 
                        to="/departments" 
                        className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center justify-center gap-2"
                    >
                        <FiArrowLeft /> Back to Departments
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
            <div className="container mx-auto">
                {/* Header with back button */}
               

                {/* Department header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800 mb-2">{department.name}</h1>
                        <p className="text-gray-600">Department details and member management</p>
                    </div>
                    
                    <div className="flex items-center gap-2 bg-white px-4 py-3 rounded-lg shadow-sm border border-gray-200 self-start">
                        <FiUsers className="text-indigo-500 text-xl" />
                        <span className="font-semibold text-gray-800">{users.length}</span>
                        <span className="text-gray-600">Employees</span>
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-xl shadow overflow-hidden">
                    <div className="border-b border-gray-200 p-4 md:p-6">
                        <h2 className="text-lg font-semibold text-gray-800">Department Members</h2>
                    </div>
                    
                    {/* Desktop Table */}
                    <div className="hidden md:block">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="p-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                                    <th className="p-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                    <th className="p-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Roles</th>
                                    <th className="p-4 text-right text-sm font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {users.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="p-8 text-center text-gray-500">
                                            <FiUsers className="mx-auto text-3xl text-gray-400 mb-2" />
                                            <p>No employees in this department</p>
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((user, index) => (
                                        <motion.tr 
                                            key={user.uniqueKey}  // Use the unique key we created
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="hover:bg-gray-50"
                                        >
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <img 
                                                        src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.username}`} 
                                                        alt={user.username}
                                                        className="w-10 h-10 rounded-full"
                                                    />
                                                    <div>
                                                        <div className="font-medium text-gray-900">{user.username}</div>
                                                        <div className="text-sm text-gray-500">{user.position || 'No position specified'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2 text-gray-700">
                                                    <FiMail size={14} className="text-gray-400" />
                                                    {user.email}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-wrap gap-2">
                                                    {/* Ensure roles is an array and extract names if needed */}
                                                    {(user.roles || []).map(role => {
                                                        // Handle both string roles and object roles with name property
                                                        const roleName = typeof role === 'object' ? role.name : role;
                                                        return (
                                                            <span 
                                                                key={roleName} 
                                                                className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full"
                                                            >
                                                                {roleName}
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            </td>
                                            <td className="p-4 text-right">
                                                <button 
                                                    onClick={() => setSelectedUser(user)}
                                                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                                >
                                                    <FiEdit size={14} className="mr-1" /> Manage
                                                </button>
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Mobile Cards */}
                    <div className="md:hidden">
                        {users.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <FiUsers className="mx-auto text-3xl text-gray-400 mb-2" />
                                <p>No employees in this department</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-200">
                                {users.map((user, index) => (
                                    <motion.div 
                                        key={user.uniqueKey}  // Use the unique key we created
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="p-4"
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-3">
                                                <img 
                                                    src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.username}`} 
                                                    alt={user.username}
                                                    className="w-12 h-12 rounded-full"
                                                />
                                                <div>
                                                    <div className="font-medium text-gray-900">{user.username}</div>
                                                    <div className="text-sm text-gray-500">{user.position || 'No position specified'}</div>
                                                </div>
                                            </div>
                                            
                                            <button 
                                                onClick={() => setUserMenuOpen(userMenuOpen === user.uniqueKey ? null : user.uniqueKey)}
                                                className="p-1 text-gray-400 hover:text-gray-600"
                                            >
                                                <FiMoreVertical size={18} />
                                            </button>
                                        </div>
                                        
                                        <div className="flex items-center gap-2 text-gray-700 mb-3">
                                            <FiMail size={14} className="text-gray-400" />
                                            <span className="text-sm">{user.email}</span>
                                        </div>
                                        
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {/* Ensure roles is an array and extract names if needed */}
                                            {(user.roles || []).map(role => {
                                                // Handle both string roles and object roles with name property
                                                const roleName = typeof role === 'object' ? role.name : role;
                                                return (
                                                    <span 
                                                        key={roleName} 
                                                        className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full"
                                                    >
                                                        {roleName}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                        
                                        {userMenuOpen === user.uniqueKey && (
                                            <div className="mt-3 pt-3 border-t border-gray-200">
                                                <button 
                                                    onClick={() => {
                                                        setSelectedUser(user);
                                                        setUserMenuOpen(null);
                                                    }}
                                                    className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                                >
                                                    <FiEdit size={14} /> Manage Permissions
                                                </button>
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {selectedUser && (
                    <UserPermissionModal
                        user={selectedUser}
                        onClose={() => setSelectedUser(null)}
                        onSave={handleSaveChanges}
                    />
                )}
            </div>
        </div>
    );
};

export default DepartmentDetailsPage;