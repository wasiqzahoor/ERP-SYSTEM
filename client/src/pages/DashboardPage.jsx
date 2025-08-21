// src/pages/DashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { FiBox, FiUsers, FiClock, FiDollarSign, FiArrowRight, FiPieChart, FiTrendingUp, FiUserCheck, FiShoppingCart, FiCreditCard } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Line, Pie } from 'react-chartjs-2';
import {
    Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement
} from 'chart.js';

// ChartJS ke saare zaroori parts register karein
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement);

// Stat Card Component
const StatCard = ({ icon, title, value, loading, color, delay }) => (
    <motion.div
        className={`relative bg-white p-6 rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl group transform hover:-translate-y-2`}
        style={{ borderLeft: `6px solid ${color}` }}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: delay }}
    >
        <div className={`absolute top-0 right-0 p-3 rounded-bl-2xl opacity-10 group-hover:opacity-20 transition-opacity`} style={{ backgroundColor: color }}>
            {React.cloneElement(icon, { className: 'text-6xl text-white' })}
        </div>
        <div className="flex items-center gap-4">
            <div className="text-2xl p-3 rounded-full" style={{ backgroundColor: `${color}1A`, color: color }}>
                {icon}
            </div>
            <div>
                <p className="text-gray-500 text-sm font-medium">{title}</p>
                {loading ? (
                    <div className="h-8 w-24 bg-gray-200 rounded animate-pulse mt-1"></div>
                ) : (
                    <p className="text-2xl font-bold text-gray-800">{value}</p>
                )}
            </div>
        </div>
    </motion.div>
);

const DashboardPage = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                const res = await api.get('/api/dashboard/stats');
                setStats(res.data);
            } catch (error) {
                console.error("Failed to fetch dashboard stats", error);
                toast.error('Failed to fetch dashboard stats');
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const lineChartData = {
        labels: stats?.salesLast7Days.map(d => new Date(d._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })) || [],
        datasets: [{
            label: 'Sales ($)',
            data: stats?.salesLast7Days.map(d => d.totalSales) || [],
            borderColor: 'rgb(79, 70, 229)',
            backgroundColor: 'rgba(79, 70, 229, 0.1)',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: 'rgb(79, 70, 229)',
            pointRadius: 5,
            pointHoverRadius: 8,
        }],
    };

    const pieChartData = {
        labels: stats?.productCategories.map(cat => cat._id) || [],
        datasets: [{
            label: '# of Products',
            data: stats?.productCategories.map(cat => cat.count) || [],
            backgroundColor: ['#4F46E5', '#60A5FA', '#FBBF24', '#34D399', '#A78BFA'],
            borderColor: '#fff',
            borderWidth: 2,
        }],
    };

    return (
        <motion.div
            className="p-8 min-h-full bg-gradient-to-br from-gray-50 to-gray-100"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <div className="container mx-auto">
                <motion.div
                    className="mb-8"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <h1 className="text-4xl font-extrabold text-gray-900 leading-tight">
                        Welcome back, <span className="text-indigo-600">{user?.username || 'Admin'}!</span>
                    </h1>
                    <p className="text-gray-600 mt-1 text-lg">Here's a quick overview of your business.</p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    <StatCard icon={<FiDollarSign />} title="Total Sales" value={`$${stats?.totalSales.toFixed(2) || '0.00'}`} loading={loading} color="#4F46E5" delay={0.1} />
                    <StatCard icon={<FiBox />} title="Total Products" value={stats?.totalProducts || 0} loading={loading} color="#34D399" delay={0.2} />
                    <StatCard icon={<FiClock />} title="Pending Orders" value={stats?.pendingOrders || 0} loading={loading} color="#FBBF24" delay={0.3} />
                    <StatCard icon={<FiUsers />} title="Active Users" value={stats?.totalUsers || 0} loading={loading} color="#60A5FA" delay={0.4} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* --- Left Column: Charts aur Recent Orders --- */}
                    <div className="lg:col-span-2 space-y-8">
                        <motion.div
                            className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5, duration: 0.6 }}
                        >
                            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                                <FiTrendingUp className="text-indigo-500" /> Sales Trend (Last 7 Days)
                            </h2>
                            {loading ? <div className="h-72 bg-gray-200 rounded animate-pulse"></div> : <Line data={lineChartData} options={{ responsive: true }} />}
                        </motion.div>
                        
                        <motion.div
                            className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6, duration: 0.6 }}
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                    <FiShoppingCart className="text-indigo-500" /> Recent Orders
                                </h2>
                                <Link to="/sales" className="text-indigo-600 font-semibold text-sm flex items-center gap-1 hover:underline transition-transform hover:translate-x-1">
                                    View All <FiArrowRight size={14}/>
                                </Link>
                            </div>
                            {loading ? <p className="text-gray-500">Loading...</p> : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {stats?.recentOrders.map(order => (
                                                <tr key={order._id} className="hover:bg-gray-50 transition-colors duration-200">
                                                    <td className="px-6 py-4 whitespace-nowrap"><p className="text-sm font-semibold text-gray-900">{order.orderId.substring(0, 8)}...</p></td>
                                                    <td className="px-6 py-4 whitespace-nowrap"><p className="text-sm text-gray-800">{order.customer?.name || 'N/A'}</p></td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right"><p className="text-sm font-bold text-gray-700">${order.totalAmount.toFixed(2)}</p></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </motion.div>
                    </div>
                    
                    {/* --- Right Column: Dynamic Cards --- */}
                    <div className="space-y-8">
                        
                        
                        <motion.div
                            className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.8, duration: 0.6 }}
                        >
                            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                                <FiTrendingUp className="text-indigo-500" /> Top Performers
                            </h2>
                            {loading ? <p className="text-gray-500">Loading...</p> : (
                                <ul className="space-y-4 text-sm">
                                    <li className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                        <span className="text-gray-600 flex items-center gap-2"><FiBox className="text-indigo-400"/>Best Selling Product:</span>
                                        <span className="font-bold text-gray-800">{stats?.topSellingProduct}</span>
                                    </li>
                                    <li className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                        <span className="text-gray-600 flex items-center gap-2"><FiUserCheck className="text-indigo-400"/>Top Customer:</span>
                                        <span className="font-bold text-gray-800">{stats?.topCustomer}</span>
                                    </li>
                                </ul>
                            )}
                        </motion.div>
                        
                        <motion.div
                            className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.9, duration: 0.6 }}
                        >
                            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                                <FiPieChart className="text-indigo-500" /> Product Categories
                            </h2>
                            <div style={{ maxWidth: '300px', margin: 'auto' }}>
                                {loading ? <div className="h-56 bg-gray-200 rounded-full animate-pulse"></div> : <Pie data={pieChartData} options={{ responsive: true, plugins: { legend: { position: 'bottom' }} }} />}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default DashboardPage;