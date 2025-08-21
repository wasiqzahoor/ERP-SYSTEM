import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { FiArrowLeft, FiUser, FiBriefcase, FiShield, FiCheck, FiX, FiDollarSign, FiEdit2, FiSave, FiPlus, FiTrash2 } from 'react-icons/fi';
import { FaLandmark } from 'react-icons/fa';
import { toast } from 'react-toastify';

const EmployeeProfilePage = () => {
    const { id } = useParams();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState(null);
    const { hasPermission } = useAuth();

    const fetchUser = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/api/users/${id}`);
            setUser(res.data);
            setFormData(res.data);
        } catch (error) {
            console.error("Failed to fetch user details", error);
            toast.error('Failed to fetch user details');
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchUser();
    }, [id]);

    const handleFormChange = (e, section) => {
        const { name, value } = e.target;
        const processedValue = name === 'basicSalary' ? parseFloat(value) || 0 : value;

        setFormData(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [name]: processedValue
            }
        }));
    };

    const handleAllowanceChange = (index, field, value) => {
        const newAllowances = [...formData.salaryStructure.allowances];
        newAllowances[index][field] = field === 'amount' ? parseFloat(value) || 0 : value;
        setFormData(prev => ({
            ...prev,
            salaryStructure: { ...prev.salaryStructure, allowances: newAllowances }
        }));
    };

    const addAllowance = () => {
        const newAllowances = [...(formData.salaryStructure.allowances || []), { name: '', amount: 0 }];
        setFormData(prev => ({
            ...prev,
            salaryStructure: { ...prev.salaryStructure, allowances: newAllowances }
        }));
    };

    const removeAllowance = (index) => {
        const newAllowances = [...formData.salaryStructure.allowances];
        newAllowances.splice(index, 1);
        setFormData(prev => ({
            ...prev,
            salaryStructure: { ...prev.salaryStructure, allowances: newAllowances }
        }));
    };

    const handleSave = async () => {
        try {
            const dataToUpdate = {
                salaryStructure: formData.salaryStructure,
                bankDetails: formData.bankDetails
            };
            await api.put(`/api/users/${id}/permissions`, dataToUpdate);
            setIsEditing(false);
            fetchUser();
            toast.success('Details updated successfully!');
        } catch (error) {
            console.error('Failed to save details:', error);
            toast.error('Failed to save details.');
        }
    };
    
    const finalPermissions = useMemo(() => {
        if (!user) return {};
        const permissions = {};
        user.roles.forEach(role => {
            role.permissions.forEach(p => {
                if (!permissions[p.module]) permissions[p.module] = {};
                permissions[p.module][p.action] = { hasAccess: true, source: 'Role' };
            });
        });
        user.permissionOverrides.forEach(override => {
            const p = override.permission;
            if (!permissions[p.module]) permissions[p.module] = {};
            permissions[p.module][p.action] = { hasAccess: override.hasAccess, source: override.hasAccess ? 'Granted' : 'Revoked' };
        });
        return permissions;
    }, [user]);

    if (loading) return (
        <div className="p-4 md:p-10 text-center">
            <div className="animate-pulse flex flex-col items-center">
                <div className="h-8 w-64 bg-gray-300 rounded mb-4"></div>
                <div className="h-4 w-48 bg-gray-300 rounded"></div>
            </div>
        </div>
    );
    
    if (!user || !formData) return (
        <div className="p-4 md:p-10 text-center text-red-500">
            Could not load user profile.
        </div>
    );

    return (
        <div className="p-4 sm:p-6 md:p-8 bg-gray-100 min-h-screen">
           

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
                {/* Left Column: User Info & Financial Details */}
                <div className="lg:col-span-1 space-y-4 md:space-y-6">
                    {/* User Info Card */}
                    <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
                        <div className="text-center">
                            <img 
                                src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.username}`} 
                                alt="avatar" 
                                className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-full mx-auto mb-3 md:mb-4 border-4 border-indigo-200" 
                            />
                            <h1 className="text-xl md:text-2xl font-bold">{user.username}</h1>
                            <p className="text-gray-500 text-sm md:text-base">{user.email}</p>
                        </div>
                        <div className="mt-4 md:mt-6 border-t pt-3 md:pt-4 space-y-2 md:space-y-3">
                            <p className="flex items-center text-sm md:text-base">
                                <FiUser className="mr-2 md:mr-3 text-gray-500 flex-shrink-0" />
                                Status: <span className="ml-2 font-semibold capitalize">{user.status}</span>
                            </p>
                            <p className="flex items-center text-sm md:text-base">
                                <FiShield className="mr-2 md:mr-3 text-gray-500 flex-shrink-0" />
                                Role(s): <span className="ml-2 font-semibold">{user.roles.map(r => r.name).join(', ')}</span>
                            </p>
                            <p className="flex items-center text-sm md:text-base">
                                <FiBriefcase className="mr-2 md:mr-3 text-gray-500 flex-shrink-0" />
                                Department: <span className="ml-2 font-semibold">{user.department?.name || 'N/A'}</span>
                            </p>
                        </div>
                    </div>

                    {/* Financial Details Card */}
                    <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
                        <div className="flex justify-between items-center mb-3 md:mb-4">
                            <h2 className="text-lg md:text-xl font-bold">Financial Details</h2>
                            {hasPermission('salary:update') && !isEditing && (
                                <button 
                                    onClick={() => setIsEditing(true)} 
                                    className="text-blue-500 hover:text-blue-700 p-1 md:p-2 bg-blue-50 rounded-full"
                                    title="Edit Financial Details"
                                >
                                    <FiEdit2 size={16} />
                                </button>
                            )}
                        </div>

                        <div className="space-y-3 md:space-y-4">
                            <h3 className="font-semibold flex items-center text-sm md:text-base">
                                <FiDollarSign className="mr-2 flex-shrink-0" /> Salary Structure
                            </h3>
                            <div className="text-sm space-y-2">
                                <label className="font-semibold text-gray-600 text-xs md:text-sm">Basic Salary:</label>
                                {isEditing ? (
                                    <input 
                                        type="number" 
                                        name="basicSalary" 
                                        value={formData.salaryStructure?.basicSalary || ''} 
                                        onChange={(e) => handleFormChange(e, 'salaryStructure')} 
                                        className="w-full p-2 border rounded-md text-sm" 
                                    />
                                ) : (
                                    <p className="pl-2">${user.salaryStructure?.basicSalary?.toFixed(2) || '0.00'}</p>
                                )}
                            </div>

                            {/* Allowances Section */}
                            <div className="text-sm space-y-2 pt-2 border-t mt-3 md:mt-4">
                                <label className="font-semibold text-gray-600 text-xs md:text-sm">Allowances / Bonuses:</label>
                                {isEditing ? (
                                    <div className="space-y-2">
                                        {formData.salaryStructure?.allowances?.map((allowance, index) => (
                                            <div key={index} className="flex items-center gap-2">
                                                <input 
                                                    type="text" 
                                                    placeholder="Allowance Name" 
                                                    value={allowance.name} 
                                                    onChange={(e) => handleAllowanceChange(index, 'name', e.target.value)} 
                                                    className="w-2/3 p-1.5 border rounded-md text-sm" 
                                                />
                                                <input 
                                                    type="number" 
                                                    placeholder="Amount" 
                                                    value={allowance.amount} 
                                                    onChange={(e) => handleAllowanceChange(index, 'amount', e.target.value)} 
                                                    className="w-1/3 p-1.5 border rounded-md text-sm" 
                                                />
                                                <button 
                                                    onClick={() => removeAllowance(index)} 
                                                    className="text-red-500 p-1 bg-red-50 rounded-full"
                                                >
                                                    <FiTrash2 size={14} />
                                                </button>
                                            </div>
                                        ))}
                                        <button 
                                            onClick={addAllowance} 
                                            className="flex items-center text-xs text-indigo-600 font-semibold mt-1"
                                        >
                                            <FiPlus size={14} className="mr-1" />Add Allowance
                                        </button>
                                    </div>
                                ) : (
                                    user.salaryStructure?.allowances?.length > 0 ? (
                                        user.salaryStructure.allowances.map((allowance, index) => (
                                            <div key={index} className="flex justify-between pl-2 text-sm">
                                                <span>{allowance.name}:</span>
                                                <span>${allowance.amount.toFixed(2)}</span>
                                            </div>
                                        ))
                                    ) : <p className="pl-2 text-gray-500 text-sm">No allowances added.</p>
                                )}
                            </div>
                        </div>

                        <div className="mt-4 md:mt-6 border-t pt-3 md:pt-4 space-y-2 md:space-y-3">
                            <h3 className="font-semibold flex items-center text-sm md:text-base">
                                <FaLandmark className="mr-2 flex-shrink-0" /> Bank Details
                            </h3>
                            <div className="text-sm space-y-2">
                                <label className="font-semibold text-gray-600 text-xs md:text-sm">Bank Name:</label>
                                {isEditing ? (
                                    <input 
                                        name="bankName" 
                                        value={formData.bankDetails?.bankName || ''} 
                                        onChange={(e) => handleFormChange(e, 'bankDetails')} 
                                        className="w-full p-2 border rounded-md text-sm" 
                                    />
                                ) : (
                                    <p className="pl-2 text-sm">{user.bankDetails?.bankName || 'N/A'}</p>
                                )}

                                <label className="font-semibold text-gray-600 text-xs md:text-sm">Account Number:</label>
                                {isEditing ? (
                                    <input 
                                        name="accountNumber" 
                                        value={formData.bankDetails?.accountNumber || ''} 
                                        onChange={(e) => handleFormChange(e, 'bankDetails')} 
                                        className="w-full p-2 border rounded-md text-sm" 
                                    />
                                ) : (
                                    <p className="pl-2 text-sm">{user.bankDetails?.accountNumber || 'N/A'}</p>
                                )}
                            </div>
                        </div>

                        {/* Save/Cancel buttons are only shown when in edit mode */}
                        {isEditing && (
                            <div className="mt-4 md:mt-6 flex justify-end gap-2 md:gap-3 border-t pt-3 md:pt-4">
                                <button 
                                    onClick={() => { setIsEditing(false); setFormData(user); }} 
                                    className="bg-gray-200 px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-semibold hover:bg-gray-300 text-sm"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleSave} 
                                    className="bg-green-600 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-semibold hover:bg-green-700 text-sm flex items-center"
                                >
                                    <FiSave className="inline mr-1 md:mr-2" /> Save
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Permissions */}
                <div className="lg:col-span-2 bg-white p-4 md:p-6 rounded-lg shadow-md">
                    <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">Effective Permissions</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full border text-xs md:text-sm">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="px-2 py-1.5 md:px-4 md:py-2 border text-left">Module</th>
                                    <th className="px-2 py-1.5 md:px-4 md:py-2 border text-left">Action</th>
                                    <th className="px-2 py-1.5 md:px-4 md:py-2 border text-left">Access</th>
                                    <th className="px-2 py-1.5 md:px-4 md:py-2 border text-left">Source</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(finalPermissions).length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="text-center py-4 text-gray-500">
                                            No permissions found.
                                        </td>
                                    </tr>
                                ) : (
                                    Object.entries(finalPermissions).map(([module, actions]) =>
                                        Object.entries(actions).map(([action, info], idx) => (
                                            <tr key={`${module}-${action}`} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                                <td className="px-2 py-1.5 md:px-4 md:py-2 border">{module}</td>
                                                <td className="px-2 py-1.5 md:px-4 md:py-2 border">{action}</td>
                                                <td className="px-2 py-1.5 md:px-4 md:py-2 border">
                                                    {info.hasAccess ? (
                                                        <span className="text-green-600 flex items-center">
                                                            <FiCheck className="mr-1 flex-shrink-0" /> Granted
                                                        </span>
                                                    ) : (
                                                        <span className="text-red-600 flex items-center">
                                                            <FiX className="mr-1 flex-shrink-0" /> Revoked
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-2 py-1.5 md:px-4 md:py-2 border">{info.source}</td>
                                            </tr>
                                        ))
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployeeProfilePage;