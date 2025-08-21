import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiLock, FiBriefcase, FiShield } from 'react-icons/fi';
import { toast } from 'react-toastify'; 

const AddEmployeePage = () => {
    const [formData, setFormData] = useState({ username: '', email: '', password: '', roleId: '', departmentId: '' });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const [roles, setRoles] = useState([]);
    const [departments, setDepartments] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [rolesRes, deptsRes] = await Promise.all([
                    api.get('/api/roles'),
                    api.get('/api/departments')
                ]);
                setRoles(rolesRes.data.filter(r => r.name !== 'Admin' && r.name !== 'Super Admin'));
                setDepartments(deptsRes.data);
            } catch (err) {
                toast.error('Could not load roles or departments.');
            }
        };
        fetchData();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/api/users/employee', formData);
            toast.success(res.data.message);

            setTimeout(() => {
                navigate('/hrm/employees');
            }, 2000);
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Failed to create employee.';
            
            toast.error(errorMessage);

        } finally {
            setLoading(false);
        }
    };
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white p-10 rounded-xl shadow-2xl w-full max-w-lg"
            >
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold">Add New Employee</h1>
                    <p className="text-gray-500">Create a new user account for your company.</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative flex items-center">
                        <FiUser className="absolute ml-3 text-gray-400" />
                        <input type="text" name="username" onChange={handleChange} placeholder="Username" required className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
                    </div>
                    <div className="relative flex items-center">
                        <FiMail className="absolute ml-3 text-gray-400" />
                        <input type="email" name="email" onChange={handleChange} placeholder="Email" required className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
                    </div>
                    <div className="relative flex items-center">
                        <FiLock className="absolute ml-3 text-gray-400" />
                        <input type="password" name="password" onChange={handleChange} placeholder="Temporary Password" required className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
                    </div>
                    
                    {/* Role Dropdown */}
                    <div className="relative flex items-center">
                        <FiShield className="absolute ml-3 text-gray-400" />
                        <select name="roleId" value={formData.roleId} onChange={handleChange} required className="w-full p-3 pl-10 border border-gray-300 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            <option value="">Select a Role...</option>
                            {roles.map(role => (
                                <option key={role._id} value={role._id}>{role.name}</option>
                            ))}
                        </select>
                    </div>
                    
                    {/* Department Dropdown */}
                    <div className="relative flex items-center">
                        <FiBriefcase className="absolute ml-3 text-gray-400" />
                        <select name="departmentId" value={formData.departmentId} onChange={handleChange} className="w-full p-3 pl-10 border border-gray-300 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            <option value="">Select a Department (Optional)...</option>
                            {departments.map(dept => (
                                <option key={dept._id} value={dept._id}>{dept.name}</option>
                            ))}
                        </select>
                    </div>
                    
                    <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-3 rounded-lg font-bold hover:from-indigo-700 transition-all duration-300 disabled:opacity-50 flex items-center justify-center">
                        {loading ? <div className="w-5 h-5 border-t-2 border-white border-solid rounded-full animate-spin"></div> : 'Create Employee Account'}
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export default AddEmployeePage;