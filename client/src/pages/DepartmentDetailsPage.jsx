import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import { FiArrowLeft, FiEdit, FiUsers } from 'react-icons/fi';
import { toast } from 'react-toastify'; 

const DepartmentDetailsPage = () => {
    const { id } = useParams();
    const [department, setDepartment] = useState(null);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);

    const fetchDetails = async () => {
        const res = await api.get(`/api/departments/${id}`);
        setDepartment(res.data.department);
        setUsers(res.data.users);
    };

    useEffect(() => {
        fetchDetails();
    }, [id]);

    const handleSaveChanges = async (userId, roles, overrides) => {
        try {
            await api.put(`/api/users/${userId}/permissions`, { roles, permissionOverrides: overrides });
            fetchDetails(); // Data refresh karein
        } catch (error) {
            toast.error('Failed to save permissions.');
        }
    };
    
    if (!department) return <div>Loading...</div>;

    return (
        <div className="p-8">
            <Link to="/departments" className="text-indigo-600 flex items-center mb-4">
                <FiArrowLeft className="mr-2" /> Back to Departments
            </Link>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-4xl font-bold">{department.name}</h1>
                <p className="flex items-center text-xl"><FiUsers className="mr-2"/> {users.length} Employees</p>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-lg shadow">
                <table className="w-full">
                    {/* ... (Table Head) ... */}
                    <tbody>
                        {users.map(user => (
                            <tr key={user._id}>
                                <td className="p-4">{user.username}</td>
                                <td className="p-4">{user.roles.map(r => r.name).join(', ')}</td>
                                <td className="p-4 text-center">
                                    <button onClick={() => setSelectedUser(user)} className="text-indigo-600 flex items-center gap-1">
                                        <FiEdit size={14}/> Manage Permissions
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {selectedUser && (
                <UserPermissionModal
                    user={selectedUser}
                    onClose={() => setSelectedUser(null)}
                    onSave={handleSaveChanges}
                />
            )}
        </div>
    );
};
export default DepartmentDetailsPage;