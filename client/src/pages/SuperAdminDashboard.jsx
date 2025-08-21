import React, { useState, useEffect, useMemo } from 'react';
import api from '../api';
import { Link } from 'react-router-dom';
import { 
  FiUsers, FiBox, FiClipboard, FiMoreVertical, FiTrash2, 
  FiToggleLeft, FiToggleRight, FiEye, FiSearch, FiLoader, FiPlus, 
  FiChevronDown, FiX, FiMenu, FiChevronUp
} from 'react-icons/fi';
import { toast } from 'react-toastify'; 

const ConfirmationModal = ({ isOpen, onConfirm, onCancel, message }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-900">Confirm Action</h3>
        </div>
        <div className="p-6">
          <p className="text-gray-600">{message}</p>
        </div>
        <div className="bg-gray-50 px-6 py-4 flex flex-col sm:flex-row justify-end gap-3">
          <button 
            onClick={onCancel} 
            className="px-5 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm} 
            className="px-5 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors duration-200 flex items-center justify-center"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }) => (
  <div className={`bg-gradient-to-br ${color} p-5 rounded-2xl shadow-lg text-white`}>
    <div className="flex justify-between items-start">
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="mt-1 opacity-90 text-sm sm:text-base">{title}</p>
      </div>
      <div className="bg-white bg-opacity-20 p-3 rounded-xl">
        {icon}
      </div>
    </div>
  </div>
);

const StatusBadge = ({ status }) => (
  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
    status === 'active' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-amber-100 text-amber-800'
  }`}>
    {status.charAt(0).toUpperCase() + status.slice(1)}
  </span>
);

// Mobile Tenant Card Component
const MobileTenantCard = ({ tenant, onToggleStatus, onView, onDelete }) => (
  <div className="bg-white rounded-lg shadow-md p-4 mb-4">
    <div className="flex justify-between items-start">
      <div className="flex items-center">
        <div className="bg-indigo-100 text-indigo-800 w-10 h-10 rounded-lg flex items-center justify-center font-bold mr-3">
          {tenant.name.charAt(0)}
        </div>
        <div>
          <div className="font-medium text-gray-900">{tenant.name}</div>
          <div className="text-sm text-gray-500">{new Date(tenant.createdAt).toLocaleDateString()}</div>
        </div>
      </div>
      <StatusBadge status={tenant.status} />
    </div>
    
    <div className="mt-4 grid grid-cols-2 gap-2">
      <div className="text-center">
        <div className="text-xs text-gray-500">Subdomain</div>
        <div className="bg-gray-100 px-2 py-1 rounded-md text-sm font-mono mt-1">{tenant.subdomain}</div>
      </div>
      <div className="text-center">
        <div className="text-xs text-gray-500">Users</div>
        <div className="font-medium mt-1">{tenant.userCount}</div>
      </div>
      <div className="text-center">
        <div className="text-xs text-gray-500">Products</div>
        <div className="font-medium mt-1">{tenant.productCount}</div>
      </div>
    </div>
    
    <div className="mt-4 flex justify-between pt-3 border-t border-gray-100">
      <button
        onClick={() => onView(tenant)}
        className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
      >
        View Details
      </button>
      
      <div className="flex space-x-3">
        <button
          onClick={() => onToggleStatus(tenant)}
          className={`p-1 rounded ${
            tenant.status === 'active' 
              ? 'text-green-500 hover:bg-green-50' 
              : 'text-gray-400 hover:bg-gray-100'
          }`}
          title={tenant.status === 'active' ? 'Deactivate' : 'Activate'}
        >
          {tenant.status === 'active' ? 
            <FiToggleRight size={18} /> : 
            <FiToggleLeft size={18} />
          }
        </button>

        <button
          onClick={() => onDelete(tenant)}
          className="text-red-500 hover:text-red-700 p-1"
          title="Delete Tenant"
        >
          <FiTrash2 size={16} />
        </button>
      </div>
    </div>
  </div>
);

const SuperAdminDashboard = () => {
  const [stats, setStats] = useState({});
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, tenant: null });
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, tenantsRes] = await Promise.all([
        api.get('/api/superadmin/stats'),
        api.get('/api/superadmin/tenants')
      ]);
      setStats(statsRes.data);
      setTenants(tenantsRes.data);
    } catch (error) {
      console.error("Failed to fetch super admin data", error);
      toast.error('Failed to fetch super admin data');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleStatus = async (tenant) => {
    const newStatus = tenant.status === 'active' ? 'inactive' : 'active';
    try {
      await api.patch(`/api/superadmin/tenants/${tenant._id}/status`, { status: newStatus });
      setTenants(tenants.map(t => t._id === tenant._id ? { ...t, status: newStatus } : t));
      toast.success(`Company ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Failed to update status.', error);
      toast.error('Failed to update status.');
    }
  };

  const handleDeleteTenant = async () => {
    if (!deleteModal.tenant) return;

    try {
      await api.delete(`/api/superadmin/tenants/${deleteModal.tenant._id}`);
      setTenants(prevTenants => prevTenants.filter(t => t._id !== deleteModal.tenant._id));
      toast.success('Company deleted successfully');
    } catch (error) {
      console.error('Failed to delete tenant.', error);
      toast.error('Failed to delete tenant.');
    } finally {
      setDeleteModal({ isOpen: false, tenant: null });
    }
  };

  const filteredTenants = useMemo(() =>
    tenants.filter(tenant =>
      tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.subdomain.toLowerCase().includes(searchTerm.toLowerCase())
    ), [tenants, searchTerm]
  );

  return (
    <div className="pt-2 pb-8 px-4 sm:px-6 lg:px-8 min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 mt-1 text-sm sm:text-base">Manage all companies in the system</p>
          </div>
          
          <Link
            to="/superadmin/add-company"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center justify-center transition-colors duration-200 text-sm sm:text-base"
          >
            <FiPlus className="mr-2" />
            New Company
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
          <StatCard 
            title="Total Companies" 
            value={stats.totalTenants || 0} 
            icon={<FiClipboard size={24} />}
            color="from-indigo-500 to-indigo-600" 
          />
          <StatCard 
            title="Active Companies" 
            value={stats.activeTenants || 0} 
            icon={<FiUsers size={24} />}
            color="from-green-500 to-green-600" 
          />
          <StatCard 
            title="Inactive Companies" 
            value={stats.inactiveTenants || 0} 
            icon={<FiBox size={24} />}
            color="from-amber-500 to-amber-600" 
          />
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-xl font-semibold text-gray-800">Company Directory</h2>
              
              <div className="flex flex-col xs:flex-row gap-3">
                <div className="relative w-full sm:w-64">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search companies..."
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none transition-colors"
                    onChange={(e) => setSearchTerm(e.target.value)}
                    value={searchTerm}
                  />
                </div>
                
                <button 
                  className="sm:hidden bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg flex items-center justify-center gap-2"
                  onClick={() => setShowMobileFilters(!showMobileFilters)}
                >
                  {showMobileFilters ? <FiX /> : <FiMenu />}
                  Filters
                </button>
              </div>
            </div>
          </div>

          {/* Desktop Table (hidden on mobile) */}
          <div className="overflow-x-auto hidden md:block">
            {loading ? (
              <div className="flex justify-center items-center p-12">
                <FiLoader className="animate-spin text-indigo-600" size={32} />
              </div>
            ) : filteredTenants.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-2">No companies found</div>
                <p className="text-gray-500">Try adjusting your search query</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                    <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subdomain</th>
                    <th className="p-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="p-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Users</th>
                    <th className="p-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Products</th>
                    <th className="p-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredTenants.map(tenant => (
                    <tr key={tenant._id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center">
                          <div className="bg-indigo-100 text-indigo-800 w-10 h-10 rounded-lg flex items-center justify-center font-bold mr-3">
                            {tenant.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{tenant.name}</div>
                            <div className="text-sm text-gray-500">{new Date(tenant.createdAt).toLocaleDateString()}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="bg-gray-100 px-3 py-1 rounded-md inline-block">
                          <span className="font-mono text-sm">{tenant.subdomain}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <StatusBadge status={tenant.status} />
                      </td>
                      <td className="p-4 text-center font-medium">{tenant.userCount}</td>
                      <td className="p-4 text-center font-medium">{tenant.productCount}</td>
                      <td className="p-4">
                        <div className="flex justify-center space-x-3">
                          <Link
                            to={`/superadmin/tenants/${tenant._id}`}
                            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                            title="View Details"
                          >
                            <FiEye size={18} />
                          </Link>
                          
                          <button
                            onClick={() => handleToggleStatus(tenant)}
                            className={`w-9 h-9 rounded-full flex items-center justify-center ${
                              tenant.status === 'active' 
                                ? 'text-green-500 hover:bg-green-50' 
                                : 'text-gray-400 hover:bg-gray-100'
                            } transition-colors`}
                            title={tenant.status === 'active' ? 'Deactivate' : 'Activate'}
                          >
                            {tenant.status === 'active' ? 
                              <FiToggleRight size={18} /> : 
                              <FiToggleLeft size={18} />
                            }
                          </button>

                          <button
                            onClick={() => setDeleteModal({ isOpen: true, tenant: tenant })}
                            className="w-9 h-9 rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors"
                            title="Delete Tenant"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          
          {/* Mobile Tenant List (visible on mobile) */}
          <div className="md:hidden">
            {loading ? (
              <div className="flex justify-center items-center p-12">
                <FiLoader className="animate-spin text-indigo-600" size={32} />
              </div>
            ) : filteredTenants.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-2">No companies found</div>
                <p className="text-gray-500">Try adjusting your search query</p>
              </div>
            ) : (
              <div className="p-4">
                {filteredTenants.map(tenant => (
                  <MobileTenantCard 
                    key={tenant._id}
                    tenant={tenant}
                    onToggleStatus={handleToggleStatus}
                    onView={() => window.location = `/superadmin/tenants/${tenant._id}`}
                    onDelete={() => setDeleteModal({ isOpen: true, tenant: tenant })}
                  />
                ))}
              </div>
            )}
          </div>
          
          {/* Table Footer */}
          <div className="border-t border-gray-100 px-4 sm:px-6 py-4 flex flex-col sm:flex-row justify-between items-center">
            <div className="text-sm text-gray-500 mb-4 sm:mb-0">
              Showing {filteredTenants.length} of {tenants.length} companies
            </div>
            <div className="flex items-center space-x-2">
              <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                Previous
              </button>
              <button className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700">
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {deleteModal.isOpen && (
          <ConfirmationModal 
            isOpen={deleteModal.isOpen}
            message={`Are you sure you want to permanently delete "${deleteModal.tenant?.name}" and all its data? This action cannot be undone.`}
            onConfirm={handleDeleteTenant}
            onCancel={() => setDeleteModal({ isOpen: false, tenant: null })}
          />
        )}
      </div>
    </div>
  );
};

export default SuperAdminDashboard;