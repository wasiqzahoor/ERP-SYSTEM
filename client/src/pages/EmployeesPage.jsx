// src/pages/EmployeesPage.jsx

import React, { useState, useEffect } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import { FiEdit, FiShield, FiEye, FiPlus, FiChevronLeft, FiChevronRight, FiSearch, FiX } from "react-icons/fi";
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

// --- NAYA ROLE ASSIGNMENT MODAL COMPONENT ---
const RoleAssignmentModal = ({ user, allRoles, onClose, onSave }) => {
    const [assignedRoles, setAssignedRoles] = useState(user.roles.map(r => r._id));

    const handleRoleChange = (roleId) => {
        setAssignedRoles(prev => 
            prev.includes(roleId) ? prev.filter(id => id !== roleId) : [...prev, roleId]
        );
    };

    const handleSaveClick = () => {
        onSave(user._id, assignedRoles);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-4 md:p-6 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Assign Roles for {user.username}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <FiX size={20} />
                    </button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                    {allRoles.map(role => (
                        <div key={role._id} className="flex items-center p-2 hover:bg-gray-50 rounded">
                            <input
                                type="checkbox"
                                id={`role-${role._id}`}
                                checked={assignedRoles.includes(role._id)}
                                onChange={() => handleRoleChange(role._id)}
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <label htmlFor={`role-${role._id}`} className="ml-3 block text-sm font-medium text-gray-700">
                                {role.name}
                            </label>
                        </div>
                    ))}
                </div>
                <div className="mt-6 flex justify-end gap-3 border-t pt-4">
                    <button onClick={onClose} className="bg-gray-200 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300">Cancel</button>
                    <button onClick={handleSaveClick} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700">Save Roles</button>
                </div>
            </div>
        </div>
    );
};

const StatusBadge = ({ status }) => {
    const colorMap = {
        active: 'bg-green-100 text-green-800',
        pending: 'bg-yellow-100 text-yellow-800',
        inactive: 'bg-gray-200 text-gray-700',
        terminated: 'bg-red-100 text-red-800',
    };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${colorMap[status] || colorMap.inactive}`}>{status}</span>;
};

const EmployeesPage = () => {
    const [users, setUsers] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [allRoles, setAllRoles] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedUserForDept, setSelectedUserForDept] = useState(null);
    const [selectedUserForPerms, setSelectedUserForPerms] = useState(null);
    const [selectedUserForRoles, setSelectedUserForRoles] = useState(null);
    const [selectedDept, setSelectedDept] = useState("");
    const { hasPermission } = useAuth();

    const fetchData = async (page, search) => {
        setLoading(true);
        try {
            const [usersRes, deptsRes, rolesRes] = await Promise.all([
                api.get(`/api/users?page=${page}&search=${search}`),
                api.get("/api/departments"),
                api.get("/api/roles")
            ]);
            setUsers(usersRes.data.users);
            setCurrentPage(usersRes.data.currentPage);
            setTotalPages(usersRes.data.totalPages);
            setDepartments(deptsRes.data);
            setAllRoles(rolesRes.data.filter(r => r.name !== 'Admin' && r.name !== 'Super Admin'));
        } catch (error) {
            toast.error("Could not load data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData(currentPage, searchTerm);
        }, 300);
        return () => clearTimeout(timer);
    }, [currentPage, searchTerm]);

    const handleSaveChanges = async (userId, roles, overrides) => {
        try {
            await api.put(`/api/users/${userId}/permissions`, { roles, permissionOverrides: overrides });
            toast.success("Permissions updated successfully!");
            fetchData(currentPage, searchTerm);
        } catch (error) {
            toast.error("Could not save permission changes.");
        }
    };

    const handleAssignDepartment = async () => {
        if (!selectedUserForDept || !selectedDept) {
            toast.warn("Please select a department.");
            return;
        }
        try {
            await api.put("/api/users/assign-department", { userId: selectedUserForDept._id, departmentId: selectedDept });
            toast.success("Department assigned successfully!");
            fetchData(currentPage, searchTerm);
            setSelectedUserForDept(null);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to assign department.");
        }
    };

    const handleSaveRoles = async (userId, roleIds) => {
        try {
            await api.put(`/api/users/${userId}/permissions`, { roles: roleIds });
            toast.success("User roles updated successfully!");
            fetchData(currentPage, searchTerm);
            setSelectedUserForRoles(null);
        } catch (error) {
            toast.error("Failed to update roles.");
        }
    };
    
    return (
        <div className="bg-gray-100 min-h-screen p-4 sm:p-6 md:p-8">
            <div className="container mx-auto">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">Employee Management</h1>
                        <p className="text-gray-500 mt-1 text-sm sm:text-base">Manage all users in your company.</p>
                    </div>
                    {hasPermission('user:create') && (
                        <Link to="/hrm/add-employee" className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow hover:bg-indigo-700 w-full sm:w-auto justify-center">
                            <FiPlus /> Add Employee
                        </Link>
                    )}
                </div>

                <div className="mb-4 bg-white p-3 sm:p-4 rounded-lg shadow-md">
                    <div className="relative">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            className="w-full p-2 pl-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm sm:text-base"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="p-3 sm:p-4 text-left">Employee</th>
                                <th className="p-3 sm:p-4 text-left hidden sm:table-cell">Role(s)</th>
                                <th className="p-3 sm:p-4 text-left hidden md:table-cell">Department</th>
                                <th className="p-3 sm:p-4 text-left">Status</th>
                                <th className="p-3 sm:p-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {loading ? (
                                <tr><td colSpan="5" className="text-center p-10">Loading...</td></tr>
                            ) : users.length === 0 ? (
                                <tr><td colSpan="5" className="text-center p-10">No employees found</td></tr>
                            ) : users.map((user) => (
                                <tr key={user._id}>
                                    <td className="p-3 sm:p-4">
                                        <div className="flex items-center gap-3">
                                            <img src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.username}`} alt="avatar" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full" />
                                            <div>
                                                <p className="font-bold text-sm sm:text-base">{user.username}</p>
                                                <p className="text-xs sm:text-sm text-gray-500">{user.email}</p>
                                                <div className="sm:hidden mt-1">
                                                    <p className="text-xs text-gray-600">{user.roles.map((r) => r.name).join(", ")}</p>
                                                    {user.department?.name && (
                                                        <p className="text-xs text-gray-600">Dept: {user.department.name}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-3 sm:p-4 text-left hidden sm:table-cell">{user.roles.map((r) => r.name).join(", ")}</td>
                                    <td className="p-3 sm:p-4 text-left hidden md:table-cell">{user.department?.name || "Not Assigned"}</td>
                                    <td className="p-3 sm:p-4"><StatusBadge status={user.status} /></td>
                                    <td className="p-3 sm:p-4 text-center">
                                        <div className="flex justify-center items-center space-x-2 sm:space-x-3">
                                            {hasPermission("user:read") && <Link to={`/employees/${user._id}`} className="text-blue-500" title="View Profile"><FiEye /></Link>}
                                            {hasPermission("user:update") && <button onClick={() => { setSelectedUserForDept(user); setSelectedDept(user.department?._id || ""); }} className="text-indigo-600" title="Assign Department"><FiEdit /></button>}
                                            {hasPermission("permission:update") && <button onClick={() => setSelectedUserForRoles(user)} className="text-green-600" title="Assign Roles"><FiShield /></button>}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <span className="text-sm text-gray-700">Page {currentPage} of {totalPages}</span>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1 || loading} className="p-2 rounded-md hover:bg-gray-200 disabled:opacity-50"><FiChevronLeft /></button>
                        <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || loading} className="p-2 rounded-md hover:bg-gray-200 disabled:opacity-50"><FiChevronRight /></button>
                    </div>
                </div>

                {selectedUserForDept && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                        <div className="bg-white p-4 md:p-6 rounded-lg shadow-xl w-full max-w-sm">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold">Assign Department for {selectedUserForDept.username}</h2>
                                <button onClick={() => setSelectedUserForDept(null)} className="text-gray-500 hover:text-gray-700">
                                    <FiX size={20} />
                                </button>
                            </div>
                            <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} className="w-full p-2 border rounded-md text-sm sm:text-base">
                                <option value="">Select a Department</option>
                                {departments.map((dept) => (<option key={dept._id} value={dept._id}>{dept.name}</option>))}
                            </select>
                            <div className="mt-4 flex justify-end gap-3">
                                <button onClick={() => setSelectedUserForDept(null)} className="bg-gray-300 px-4 py-2 rounded-lg font-semibold hover:bg-gray-400">Cancel</button>
                                <button onClick={handleAssignDepartment} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700">Save</button>
                            </div>
                        </div>
                    </div>
                )}

                {selectedUserForRoles && (
                    <RoleAssignmentModal
                        user={selectedUserForRoles}
                        allRoles={allRoles}
                        onClose={() => setSelectedUserForRoles(null)}
                        onSave={handleSaveRoles}
                    />
                )}
            </div>
        </div>
    );
};

export default EmployeesPage;