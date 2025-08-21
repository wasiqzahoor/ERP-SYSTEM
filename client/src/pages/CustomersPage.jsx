// src/pages/CustomersPage.jsx

import React, { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiUsers, FiUserPlus, FiDollarSign, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import ConfirmationModal from '../components/ConfirmationModal';
import { toast } from 'react-toastify';

// CustomerModal wesa hi rahega
const CustomerModal = ({ customer, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        name: customer?.name || '',
        email: customer?.email || '',
        phone: customer?.phone || '',
        address: customer?.address || '',
    });

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            let res;
            if (customer) {
                res = await api.put(`/api/customers/${customer._id}`, formData);
                toast.success(`Customer "${res.data.name}" updated successfully.`);
            } else {
                res = await api.post('/api/customers', formData);
                toast.success(`Customer "${res.data.name}" added successfully.`);
            }
            onSave(res.data);
            onClose();
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to save customer.';
            toast.error(errorMessage);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                <h2 className="text-2xl font-bold mb-4">{customer ? 'Edit Customer' : 'Add New Customer'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Full Name" required className="w-full p-2 border rounded-md" />
                    <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email Address" className="w-full p-2 border rounded-md" />
                    <input type="text" name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone Number" className="w-full p-2 border rounded-md" />
                    <textarea name="address" value={formData.address} onChange={handleChange} placeholder="Address" className="w-full p-2 border rounded-md"></textarea>
                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Save Customer</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const StatCard = ({ icon, title, value, color }) => (
    <div className="bg-white p-6 rounded-xl shadow-md flex items-center gap-6">
        <div className={`p-4 rounded-full ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-gray-500 text-sm">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
        </div>
    </div>
);



const CustomersPage = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [stats, setStats] = useState({ totalCustomers: 0, newCustomersThisMonth: 0, totalRevenue: 0 });

    const { hasPermission } = useAuth();

    // --- YEH FUNCTION AB THEEK HO GAYA HAI ---
    const fetchCustomers = async (page, search) => {
        setLoading(true);
        try {
            const res = await api.get(`/api/customers?page=${page}&search=${search}`);
            // Ab hum response object se data ahtiyat se nikal kar set karein gey
            setCustomers(res.data.customers);
            setCurrentPage(res.data.currentPage);
            setTotalPages(res.data.totalPages);
            setStats(res.data.stats);
        } catch (error) {
            console.error("Failed to fetch customers", error);
            toast.error("Failed to load customers.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchCustomers(currentPage, searchTerm);
        }, 300); // Debouncing
        return () => clearTimeout(timer);
    }, [currentPage, searchTerm]);
    
    const handleSave = () => {
        // Data ko refresh karein
        fetchCustomers(currentPage, searchTerm);
    };

    const handleDelete = async () => {
        if (!selectedCustomer) return;
        try {
            await api.delete(`/api/customers/${selectedCustomer._id}`);
            toast.success(`Customer "${selectedCustomer.name}" deleted.`);
            // Agar aakhri page par aakhri item delete ho to pichle page par jao
            if (customers.length === 1 && currentPage > 1) {
                setCurrentPage(currentPage - 1);
            } else {
                fetchCustomers(currentPage, searchTerm);
            }
            setDeleteModalOpen(false);
        } catch (error) {
            toast.error('Failed to delete customer.');
        }
    };

    const openModal = (customer = null) => { setSelectedCustomer(customer); setIsModalOpen(true); };
    const openDeleteConfirmation = (customer) => { setSelectedCustomer(customer); setDeleteModalOpen(true); };

    return (
        <div className="p-6 md:p-10 bg-gray-50 min-h-full">
            <div className="container mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-800">Customer Management</h1>
                    <p className="text-gray-500 mt-1">View, add, and manage your customer data.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <StatCard icon={<FiUsers size={24} className="text-blue-500" />} title="Total Customers" value={stats.totalCustomers} color="bg-blue-100" />
                    <StatCard icon={<FiUserPlus size={24} className="text-green-500" />} title="New Customers (This Month)" value={stats.newCustomersThisMonth} color="bg-green-100" />
                    <StatCard icon={<FiDollarSign size={24} className="text-yellow-500" />} title="Total Revenue" value={`$${stats.totalRevenue.toFixed(2)}`} color="bg-yellow-100" />
                </div>
                
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                        <div className="relative w-full md:max-w-md">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search customers..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="w-full p-2 pl-10 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        {hasPermission('order:create') && (
                            <button onClick={() => openModal()} className="w-full md:w-auto bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-indigo-700">
                                <FiPlus /> Add Customer
                            </button>
                        )}
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="p-4 text-left font-semibold text-gray-600">Name</th>
                                    <th className="p-4 text-left font-semibold text-gray-600">Email</th>
                                    <th className="p-4 text-left font-semibold text-gray-600">Phone</th>
                                    <th className="p-4 text-center font-semibold text-gray-600">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="4" className="text-center p-8">Loading...</td></tr>
                                ) : customers.map(customer => (
                                    <tr key={customer._id} className="border-b hover:bg-gray-50">
                                        <td className="p-4 font-medium text-gray-800">{customer.name}</td>
                                        <td className="p-4 text-gray-600">{customer.email}</td>
                                        <td className="p-4 text-gray-600">{customer.phone}</td>
                                        <td className="p-4 flex justify-center items-center gap-4">
                                            <button onClick={() => openModal(customer)} className="text-blue-500 hover:text-blue-700"><FiEdit size={18} /></button>
                                            <button onClick={() => openDeleteConfirmation(customer)} className="text-red-500 hover:text-red-700"><FiTrash2 size={18} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex justify-between items-center mt-6">
                        <span className="text-sm text-gray-600">Page {currentPage} of {totalPages}</span>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1 || loading} className="p-2 rounded-md hover:bg-gray-200 disabled:opacity-50"><FiChevronLeft /></button>
                            <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages || loading} className="p-2 rounded-md hover:bg-gray-200 disabled:opacity-50"><FiChevronRight /></button>
                        </div>
                    </div>
                </div>

                {isModalOpen && <CustomerModal customer={selectedCustomer} onClose={() => setIsModalOpen(false)} onSave={handleSave} />}
                {isDeleteModalOpen && <ConfirmationModal title="Delete Customer" message={`Are you sure you want to delete ${selectedCustomer?.name}?`} onConfirm={handleDelete} onCancel={() => setDeleteModalOpen(false)} confirmColor="red" />}
            </div>
        </div>
    );
};

export default CustomersPage;