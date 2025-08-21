import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { FiPlus, FiDownload, FiChevronLeft, FiChevronRight, FiSearch, FiDollarSign, FiUser } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { FaCheckCircle, FaHourglassHalf, FaTimesCircle, FaTruck, FaBan, FaListAlt } from "react-icons/fa";

const statusOptions = ['Pending', 'Paid', 'Shipped', 'Cancelled', 'Overdue'];
const statusConfig = {
  Total: { color: "from-indigo-500 to-purple-500", icon: <FaListAlt /> },
  Paid: { color: "from-green-500 to-emerald-600", icon: <FaCheckCircle /> },
  Pending: { color: "from-yellow-400 to-orange-500", icon: <FaHourglassHalf /> },
  Overdue: { color: "from-red-500 to-pink-600", icon: <FaTimesCircle /> },
  Shipped: { color: "from-blue-500 to-cyan-600", icon: <FaTruck /> },
  Cancelled: { color: "from-gray-400 to-gray-600", icon: <FaBan /> },
};

const SalesPage = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const { hasPermission } = useAuth();

    // Pagination States
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalOrders, setTotalOrders] = useState(0);

    // Search State
    const [searchQuery, setSearchQuery] = useState("");

    const fetchOrders = async (pageToFetch) => {
        setLoading(true);
        try {
            const res = await api.get(`/api/sales/orders?page=${pageToFetch}`);
            setOrders(res.data.orders);
            setCurrentPage(res.data.currentPage);
            setTotalPages(res.data.totalPages);
            setTotalOrders(res.data.totalOrders);
        } catch (error) {
            console.error("Failed to fetch orders", error);
            toast.error("Failed to load orders.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders(currentPage);
    }, [currentPage]);

    // Filtered Orders based on search
    const filteredOrders = useMemo(() => {
        return orders.filter(order =>
            order.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.orderId.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [orders, searchQuery]);

    const handleDownloadInvoice = async (orderId) => {
        try {
            const res = await api.get(`/api/sales/orders/${orderId}/invoice`, {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `invoice-${orderId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Failed to download invoice", error);
            toast.error('Could not download invoice.');
        }
    };

    const handleStatusChange = async (orderId, newStatus) => {
        try {
            const res = await api.put(`/api/sales/orders/${orderId}/status`, { status: newStatus });
            setOrders(prevOrders =>
                prevOrders.map(order =>
                    order._id === orderId ? { ...order, status: res.data.status } : order
                )
            );
            toast.success("Order status updated successfully!");
        } catch (error) {
            console.error("Failed to update status", error);
            toast.error('Could not update order status. Please try again.');
        }
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'Paid': return 'bg-green-100 text-green-800';
            case 'Pending': return 'bg-yellow-100 text-yellow-800';
            case 'Overdue': return 'bg-red-100 text-red-800';
            case 'Shipped': return 'bg-blue-100 text-blue-800';
            case 'Cancelled': return 'bg-gray-300 text-gray-700';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    // Stats
    const stats = useMemo(() => {
        const counts = { Total: orders.length, Pending: 0, Paid: 0, Shipped: 0, Cancelled: 0, Overdue: 0 };
        orders.forEach(order => {
            if (counts[order.status] !== undefined) counts[order.status]++;
        });
        return counts;
    }, [orders]);

    return (
        <div className="bg-gradient-to-br from-gray-100 to-white min-h-screen p-4 sm:p-6 md:p-8">
            <div className="container mx-auto">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800">📦 Sales & Orders</h1>
                        <p className="text-gray-500 mt-1 text-sm md:text-base">Track, manage, and update customer orders.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                        {/* Search Bar */}
                        <div className="relative flex-1">
                            <FiSearch className="absolute top-2.5 left-3 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by customer or order ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none text-xs md:text-base"
                            />
                        </div>
                        {hasPermission('order:create') && (
                            <Link
                                to="/sales/create-order"
                                className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 flex items-center justify-center gap-2 shadow text-sm md:text-base"
                            >
                                <FiPlus className="text-sm md:text-base" /> 
                                <span className="hidden sm:inline">Create Order</span>
                                <span className="sm:hidden">Create</span>
                            </Link>
                        )}
                    </div>
                </div>

                {/* Stats Section */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-6 mb-6 md:mb-10">
                    {Object.entries(stats).map(([key, value]) => {
                        const config = statusConfig[key] || statusConfig["Total"];
                        return (
                            <div
                                key={key}
                                className="bg-white rounded-xl md:rounded-2xl shadow-md hover:shadow-lg transition p-3 sm:p-4 md:p-6 flex flex-col items-center text-center"
                            >
                                <div
                                    className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-gradient-to-tr ${config.color} text-white mb-2 md:mb-3 shadow-lg`}
                                >
                                    <span className="text-sm sm:text-base md:text-xl">{config.icon}</span>
                                </div>
                                <p className="text-gray-500 text-xs sm:text-sm font-medium">{key}</p>
                                <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-800 mt-1">{value}</p>
                            </div>
                        );
                    })}
                </div>

                {/* Orders Table */}
                <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
                    {loading ? (
                        <div className="text-center p-6 md:p-10">
                            <div className="animate-pulse flex flex-col items-center">
                                <div className="h-4 w-32 bg-gray-300 rounded mb-2"></div>
                                <div className="h-4 w-48 bg-gray-300 rounded"></div>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="md:hidden">
                                {/* Mobile view */}
                                {filteredOrders.length > 0 ? (
                                    <div className="divide-y divide-gray-200">
                                        {filteredOrders.map(order => (
                                            <div key={order._id} className="p-4 hover:bg-gray-50 transition">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <p className="font-semibold text-gray-800">{order.customer?.name || 'N/A'}</p>
                                                        <p className="text-xs text-gray-500 font-mono">{order.orderId}</p>
                                                    </div>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(order.status)}`}>
                                                        {order.status}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center mb-3">
                                                    <p className="font-semibold text-gray-700 flex items-center gap-1">
                                                        <FiDollarSign className="text-green-500" />
                                                        ${order.totalAmount.toFixed(2)}
                                                    </p>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    {hasPermission('order:update') ? (
                                                        <select
                                                            value={order.status}
                                                            onChange={(e) => handleStatusChange(order._id, e.target.value)}
                                                            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(order.status)} cursor-pointer`}
                                                        >
                                                            {statusOptions.map(status => (
                                                                <option key={status} value={status}>{status}</option>
                                                            ))}
                                                        </select>
                                                    ) : (
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(order.status)}`}>
                                                            {order.status}
                                                        </span>
                                                    )}
                                                    {hasPermission('invoice:read') && (
                                                        <button
                                                            onClick={() => handleDownloadInvoice(order._id)}
                                                            className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 text-sm"
                                                        >
                                                            <FiDownload size={14} /> Invoice
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-6 text-gray-500">
                                        No matching orders found.
                                    </div>
                                )}
                            </div>
                            
                            {/* Desktop view */}
                            <table className="w-full text-sm hidden md:table">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="p-3 md:p-4 text-left font-semibold">Order ID</th>
                                        <th className="p-3 md:p-4 text-left font-semibold">Customer</th>
                                        <th className="p-3 md:p-4 text-left font-semibold">Amount</th>
                                        <th className="p-3 md:p-4 text-left font-semibold">Status</th>
                                        <th className="p-3 md:p-4 text-center font-semibold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredOrders.length > 0 ? (
                                        filteredOrders.map(order => (
                                            <tr key={order._id} className="hover:bg-gray-50 transition">
                                                <td className="p-3 md:p-4 font-mono text-xs">{order.orderId}</td>
                                                <td className="p-3 md:p-4">{order.customer?.name || 'N/A'}</td>
                                                <td className="p-3 md:p-4 font-semibold text-gray-700">${order.totalAmount.toFixed(2)}</td>
                                                <td className="p-3 md:p-4">
                                                    {hasPermission('order:update') ? (
                                                        <select
                                                            value={order.status}
                                                            onChange={(e) => handleStatusChange(order._id, e.target.value)}
                                                            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(order.status)} cursor-pointer`}
                                                        >
                                                            {statusOptions.map(status => (
                                                                <option key={status} value={status}>{status}</option>
                                                            ))}
                                                        </select>
                                                    ) : (
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(order.status)}`}>
                                                            {order.status}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-3 md:p-4 text-center">
                                                    {hasPermission('invoice:read') && (
                                                        <button
                                                            onClick={() => handleDownloadInvoice(order._id)}
                                                            className="text-indigo-600 hover:underline flex items-center justify-center mx-auto gap-1 text-sm"
                                                        >
                                                            <FiDownload size={14} /> Invoice
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="text-center py-6 text-gray-500">No matching orders found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </>
                    )}
                </div>

                {/* Pagination */}
                <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <span className="text-sm text-gray-700 text-center sm:text-left">
                        Showing <span className="font-semibold">{Math.min(1 + (currentPage - 1) * 10, totalOrders)}</span> 
                        to <span className="font-semibold">{Math.min(currentPage * 10, totalOrders)}</span> 
                        of <span className="font-semibold">{totalOrders}</span> orders
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1 || loading}
                            className="p-2 rounded-md hover:bg-gray-200 disabled:opacity-50"
                            aria-label="Previous page"
                        >
                            <FiChevronLeft />
                        </button>
                        <span className="font-semibold text-sm sm:text-base">Page {currentPage} of {totalPages}</span>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages || loading}
                            className="p-2 rounded-md hover:bg-gray-200 disabled:opacity-50"
                            aria-label="Next page"
                        >
                            <FiChevronRight />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalesPage;