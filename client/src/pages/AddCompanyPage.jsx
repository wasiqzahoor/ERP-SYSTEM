import React, { useState } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiUser, FiMail, FiLock, FiArrowLeft, FiBriefcase } from 'react-icons/fi';
import { toast } from 'react-toastify'; 
const AddCompanyPage = () => {
    const [formData, setFormData] = useState({
        companyName: '',
        adminUsername: '',
        adminEmail: '',
        adminPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        try {
            await api.post('/api/superadmin/tenants', formData);
            toast.success("Company created successfully!");
            navigate('/superadmin/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create company. Please try again.');
            toast.error('Failed to create company. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            

            <div className="flex-1 flex items-center justify-center py-8 px-4">
                <div className="w-full max-w-3xl">
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                        <div className="bg-gradient-to-r from-indigo-500 to-indigo-700 p-6 text-white">
                            <div className="flex items-center">
                                <FiBriefcase className="text-white w-8 h-8 mr-3" />
                                <div>
                                    <h2 className="text-xl font-bold">Set up a new organization</h2>
                                    <p className="text-indigo-100 opacity-90 mt-1">
                                        Add company details and create the administrator account
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-6 md:p-8">
                            {error && (
                                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                                    {error}
                                </div>
                            )}

                            {/* Company Section */}
                            <div className="mb-8">
                                <h3 className="flex items-center text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">
                                    <FiBriefcase className="mr-2 text-indigo-600" />
                                    Company Information
                                </h3>
                                
                                <div className="relative mb-5">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                                    <div className="relative">
                                        <input 
                                            type="text" 
                                            name="companyName" 
                                            onChange={handleChange} 
                                            required 
                                            placeholder="Enter company name"
                                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none transition-colors"
                                        />
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <FiBriefcase className="text-gray-400" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Admin Section */}
                            <div className="mb-8">
                                <h3 className="flex items-center text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">
                                    <FiUser className="mr-2 text-indigo-600" />
                                    Administrator Account
                                </h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                                    <div className="relative">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                                        <div className="relative">
                                            <input 
                                                type="text" 
                                                name="adminUsername" 
                                                onChange={handleChange} 
                                                required 
                                                placeholder="Enter username"
                                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none transition-colors"
                                            />
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <FiUser className="text-gray-400" />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="relative">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                        <div className="relative">
                                            <input 
                                                type="email" 
                                                name="adminEmail" 
                                                onChange={handleChange} 
                                                required 
                                                placeholder="Enter email address"
                                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none transition-colors"
                                            />
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <FiMail className="text-gray-400" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="relative">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Temporary Password</label>
                                    <div className="relative">
                                        <input 
                                            type="password" 
                                            name="adminPassword" 
                                            onChange={handleChange} 
                                            required 
                                            minLength="6" 
                                            placeholder="Set a temporary password"
                                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none transition-colors"
                                        />
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <FiLock className="text-gray-400" />
                                        </div>
                                    </div>
                                    <p className="mt-1 text-xs text-gray-500">Minimum 6 characters</p>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row justify-between items-center pt-4 border-t border-gray-100">
                                <div className="mb-4 sm:mb-0">
                                    <p className="text-sm text-gray-600">
                                        The admin will be prompted to change this password on first login
                                    </p>
                                </div>
                                <button 
                                    type="submit" 
                                    disabled={loading}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 w-full sm:w-auto flex items-center justify-center min-w-[180px]"
                                >
                                    {loading ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <FiPlus className="mr-2" />
                                            Create Company & Admin
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                    
                    <div className="mt-6 text-center">
                        <p className="text-gray-500 text-sm">
                            The new company will have its own dedicated environment with custom subdomain
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddCompanyPage;