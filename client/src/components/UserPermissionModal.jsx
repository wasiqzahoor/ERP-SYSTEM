import React, { useState, useEffect } from 'react';
import api from '../api';
import Select from 'react-select';

const UserPermissionModal = ({ user, onClose, onSave }) => {
    const [roles, setRoles] = useState([]);
    const [permissions, setPermissions] = useState({});
    
    const [assignedRoles, setAssignedRoles] = useState(user.roles.map(r => r._id));
    const [permissionOverrides, setPermissionOverrides] = useState(user.permissionOverrides || []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [rolesRes, permsRes] = await Promise.all([
                    api.get('/api/roles'),
                    api.get('/api/permissions')
                ]);
                setRoles(rolesRes.data);
                setPermissions(permsRes.data);
            } catch (error) {
                console.error("Failed to fetch modal data", error);
            }
        };
        fetchData();
    }, []);

    const handleRoleChange = (selectedOptions) => {
        setAssignedRoles(selectedOptions ? selectedOptions.map(option => option.value) : []);
    };

    const handleOverrideChange = (permId, hasAccess) => {
        const newOverrides = [...permissionOverrides];
        const existingIndex = newOverrides.findIndex(o => (o.permission._id || o.permission) === permId);

        if (existingIndex > -1) {
            if (hasAccess === null) {
                newOverrides.splice(existingIndex, 1);
            } else {
                newOverrides[existingIndex].hasAccess = hasAccess;
            }
        } else {
            if (hasAccess !== null) {
                newOverrides.push({ permission: permId, hasAccess });
            }
        }
        setPermissionOverrides(newOverrides);
    };

    const handleSaveClick = () => {
        onSave(user._id, assignedRoles, permissionOverrides);
        onClose();
    };
    
    const roleOptions = roles.map(r => ({ value: r._id, label: r.name }));
    const selectedRoleOptions = roleOptions.filter(option => assignedRoles.includes(option.value));

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="p-6 border-b">
                    <h2 className="text-2xl font-bold">Manage User: {user.username}</h2>
                </div>
                <div className="p-6 overflow-y-auto space-y-6">
                    <div>
                        <h3 className="font-bold text-lg mb-2">Assign Roles</h3>
                        <Select
                            isMulti
                            options={roleOptions}
                            value={selectedRoleOptions}
                            onChange={handleRoleChange}
                            className="text-gray-800"
                        />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg mb-2">Permission Overrides</h3>
                        <p className="text-sm text-gray-500 mb-4">Override role permissions for this specific user. "Inherit" uses the permission from the role.</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {Object.entries(permissions).map(([moduleName, perms]) => (
                                <div key={moduleName} className="border rounded-lg p-4 bg-gray-50/50">
                                    <h4 className="font-bold capitalize mb-3 text-indigo-700">{moduleName}</h4>
                                    {perms.map(perm => {
                                        const override = permissionOverrides.find(o => (o.permission._id || o.permission) === perm._id);
                                        const overrideStatus = override ? (override.hasAccess ? 'grant' : 'revoke') : 'inherit';
                                        return (
                                            <div key={perm._id} className="flex justify-between items-center mb-2">
                                                <span className="capitalize text-sm">{perm.action}</span>
                                                <div className="flex gap-1">
                                                    <button onClick={() => handleOverrideChange(perm._id, true)} className={`px-2 py-0.5 text-xs rounded transition-colors ${overrideStatus === 'grant' ? 'bg-green-500 text-white shadow-sm' : 'bg-gray-200 hover:bg-green-200'}`}>Grant</button>
                                                    <button onClick={() => handleOverrideChange(perm._id, false)} className={`px-2 py-0.5 text-xs rounded transition-colors ${overrideStatus === 'revoke' ? 'bg-red-500 text-white shadow-sm' : 'bg-gray-200 hover:bg-red-200'}`}>Revoke</button>
                                                    <button onClick={() => handleOverrideChange(perm._id, null)} className={`px-2 py-0.5 text-xs rounded transition-colors ${overrideStatus === 'inherit' ? 'bg-blue-500 text-white shadow-sm' : 'bg-gray-200 hover:bg-blue-200'}`}>Inherit</button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="p-4 bg-gray-50 flex justify-end gap-3 border-t">
                    <button onClick={onClose} className="bg-gray-300 px-4 py-2 rounded-lg font-semibold hover:bg-gray-400">Cancel</button>
                    <button onClick={handleSaveClick} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700">Save Changes</button>
                </div>
            </div>
        </div>
    );
};

export default UserPermissionModal;