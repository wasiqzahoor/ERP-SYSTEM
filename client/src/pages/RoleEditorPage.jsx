// src/pages/RoleEditorPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { toast } from 'react-toastify'; 

const RoleEditorPage = () => {
    const { roleId } = useParams();
    const navigate = useNavigate();
    const isEditMode = Boolean(roleId);

    const [role, setRole] = useState({ name: '', description: '', permissions: [] });
    const [allPermissions, setAllPermissions] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const permsRes = await api.get('/api/permissions');
                setAllPermissions(permsRes.data);

                if (isEditMode) {
                    const roleRes = await api.get(`/api/roles/${roleId}`);
                    setRole({
                        ...roleRes.data,
                        permissions: roleRes.data.permissions.map(p => p._id)
                    });
                }
            } catch (err) {
                toast.error('Failed to load data.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [roleId, isEditMode]);

    const handlePermissionChange = (permId) => {
        setRole(prev => {
            const permissions = prev.permissions.includes(permId)
                ? prev.permissions.filter(id => id !== permId)
                : [...prev.permissions, permId];
            return { ...prev, permissions };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditMode) {
                await api.put(`/api/roles/${roleId}`, role);
                toast.success(`Role "${role.name}" updated successfully!`);
            } else {
                await api.post('/api/roles', role);
                toast.success(`Role "${role.name}" created successfully!`); 
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Failed to save role.';
            toast.error(errorMessage);
            setError(errorMessage);
        }
    };

    if (loading) return <p>Loading...</p>;

    return (
        <div className="p-8 bg-gray-100 min-h-screen">
            <h1 className="text-4xl font-bold mb-6">{isEditMode ? 'Edit Role' : 'Create New Role'}</h1>
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-lg">
                <div className="mb-4">
                    <label className="block font-bold mb-1">Role Name</label>
                    <input
                        type="text"
                        value={role.name}
                        onChange={(e) => setRole({ ...role, name: e.target.value })}
                        required
                        className="w-full p-2 border rounded-md"
                    />
                </div>
                <div className="mb-6">
                    <label className="block font-bold mb-1">Description</label>
                    <input
                        type="text"
                        value={role.description}
                        onChange={(e) => setRole({ ...role, description: e.target.value })}
                        className="w-full p-2 border rounded-md"
                    />
                </div>

                <h2 className="text-2xl font-bold mb-4">Permissions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {Object.entries(allPermissions).map(([moduleName, perms]) => (
                        <div key={moduleName} className="border p-4 rounded-lg bg-gray-50">
                            <h3 className="font-bold capitalize text-indigo-700 mb-3">{moduleName}</h3>
                            {perms.map(perm => (
                                <div key={perm._id} className="flex items-center mb-2">
                                    <input
                                        type="checkbox"
                                        id={perm._id}
                                        checked={role.permissions.includes(perm._id)}
                                        onChange={() => handlePermissionChange(perm._id)}
                                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <label htmlFor={perm._id} className="ml-2 block text-sm text-gray-900 capitalize">{perm.action}</label>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
                
                {error && <p className="text-red-500 mt-4">{error}</p>}

                <div className="mt-6 text-right">
                    <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-700">
                        Save Role
                    </button>
                </div>
            </form>
        </div>
    );
};

export default RoleEditorPage;