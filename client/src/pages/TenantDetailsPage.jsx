import React, { useState, useEffect } from 'react';
import { useParams,useNavigate  } from 'react-router-dom';
import api from '../api';
import { FiUsers, FiBox, FiDollarSign } from 'react-icons/fi';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    LineElement,
    CategoryScale,
    LinearScale,
    PointElement,
} from 'chart.js';
import { toast } from 'react-toastify'; 
import { useAuth } from '../context/AuthContext';
ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement);

const DetailStatCard = ({ title, value, icon }) => (
    <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition duration-300">
        <div className="flex items-center space-x-4">
            <div className="p-4 bg-indigo-100 rounded-full text-indigo-600 text-xl">
                {icon}
            </div>
            <div>
                <p className="text-sm text-gray-500">{title}</p>
                <p className="text-2xl font-semibold text-gray-800">{value}</p>
            </div>
        </div>
    </div>
);

const SalesChart = ({ data }) => {
    const chartData = {
        labels: data.map(d => d.date),
        datasets: [
            {
                label: 'Sales',
                data: data.map(d => d.amount),
                borderColor: '#6366F1',
                backgroundColor: 'rgba(99,102,241,0.1)',
                tension: 0.4,
            },
        ],
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-md mb-10">
            <h2 className="text-xl font-bold text-gray-700 mb-4">📈 Sales Trend</h2>
            <Line data={chartData} />
        </div>
    );
};

const TenantDetailsPage = () => {
    const { tenantId } = useParams();
    const navigate = useNavigate();
    
    const { loginWithToken } = useAuth();
    const [tenantData, setTenantData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [orderSearch, setOrderSearch] = useState('');
    const [stockSearch, setStockSearch] = useState('');
    const [orderPage, setOrderPage] = useState(1);
    const [stockPage, setStockPage] = useState(1);
    const itemsPerPage = 5;

    useEffect(() => {
        const fetchDetails = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/api/superadmin/tenants/${tenantId}/full-details`);
                setTenantData(res.data);
            } catch (error) {
                console.error("Failed to fetch tenant details", error);
                toast.error('Failed to fetch tenant details');
            }
            setLoading(false);
        };
        fetchDetails();
    }, [tenantId]);

  const handleImpersonate = async () => {
        if (window.confirm("Are you sure you want to log in as this company's admin? You will be logged out of your Super Admin account.")) {
            try {
                const res = await api.post(`/api/superadmin/tenants/${tenantId}/impersonate`);
                const { token, tenantSubdomain } = res.data;

                // loginWithToken function ko call karein
                loginWithToken(token, tenantSubdomain);

                toast.success(`Now managing ${tenantData.details.name}. Redirecting...`);
                
                // Thora sa delay dekar redirect karein takay context update ho jaye
                setTimeout(() => {
                    navigate('/dashboard');
                }, 1000);

            } catch (error) {
                console.error("Impersonation failed:", error);
                toast.error("Could not start impersonation session.");
            }
        }
    };
    if (loading) {
        return (
            <div className="p-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-300 rounded w-1/3"></div>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="h-24 bg-gray-300 rounded"></div>
                        <div className="h-24 bg-gray-300 rounded"></div>
                        <div className="h-24 bg-gray-300 rounded"></div>
                    </div>
                    <div className="h-64 bg-gray-300 rounded"></div>
                </div>
            </div>
        );
    }

    if (!tenantData) {
        return <div className="text-center p-10 text-red-500">Could not load data.</div>;
    }

    const { details, stats, recentOrders, lowStockItems } = tenantData;

    const filteredOrders = recentOrders.filter(order =>
        order.customer?.name?.toLowerCase().includes(orderSearch.toLowerCase())
    );
    const filteredStockItems = lowStockItems.filter(item =>
        item.name.toLowerCase().includes(stockSearch.toLowerCase())
    );

    const paginatedOrders = filteredOrders.slice((orderPage - 1) * itemsPerPage, orderPage * itemsPerPage);
    const paginatedStock = filteredStockItems.slice((stockPage - 1) * itemsPerPage, stockPage * itemsPerPage);

    const salesTrend = [
        { date: 'Aug 1', amount: 1200 },
        { date: 'Aug 2', amount: 1500 },
        { date: 'Aug 3', amount: 900 },
        { date: 'Aug 4', amount: 1800 },
        { date: 'Aug 5', amount: 2200 },
    ];

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-4xl font-bold text-gray-800">{details.name}</h1>
                    <p className="text-gray-500 font-mono">{details.subdomain}</p>
                </div>
                <button
                    onClick={handleImpersonate}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-semibold shadow-md transition duration-300"
                >
                    Manage as Admin
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <DetailStatCard title="Total Sales" value={`$${stats.totalSales.toFixed(2)}`} icon={<FiDollarSign />} />
                <DetailStatCard title="Total Users" value={stats.userCount} icon={<FiUsers />} />
                <DetailStatCard title="Total Products" value={stats.productCount} icon={<FiBox />} />
            </div>

            {/* Chart */}
            <SalesChart data={salesTrend} />

            {/* Data Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Orders */}
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h2 className="text-xl font-bold text-gray-700 mb-4">🧾 Recent Orders</h2>
                    <input
                        type="text"
                        placeholder="Search orders..."
                        value={orderSearch}
                        onChange={(e) => setOrderSearch(e.target.value)}
                        className="mb-4 w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <ul className="divide-y divide-gray-200">
                        {paginatedOrders.map(order => (
                            <li key={order._id} className="py-3 flex justify-between text-gray-600">
                                <span>{order.customer?.name || 'N/A'}</span>
                                <span className="font-semibold text-gray-800">${order.totalAmount.toFixed(2)}</span>
                            </li>
                        ))}
                    </ul>
                    <div className="mt-4 flex justify-end space-x-2">
                        <button onClick={() => setOrderPage(orderPage - 1)} disabled={orderPage === 1} className="px-3 py-1 bg-gray-200 rounded">Prev</button>
                        <button onClick={() => setOrderPage(orderPage + 1)} disabled={orderPage * itemsPerPage >= filteredOrders.length} className="px-3 py-1 bg-gray-200 rounded">Next</button>
                    </div>
                </div>

                {/* Low Stock Items */}
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h2 className="text-xl font-bold text-gray-700 mb-4">📦 Low Stock Items</h2>
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={stockSearch}
                        onChange={(e) => setStockSearch(e.target.value)}
                        className="mb-4 w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <ul className="divide-y divide-gray-200">
                        {paginatedStock.map(item => (
                            <li key={item._id} className="py-3 flex justify-between text-gray-600">
                                <span>{item.name}</span>
                                <span className="font-bold text-red-600">{item.stock} in stock</span>
                            </li>
                        ))}
                    </ul>
                    <div className="mt-4 flex justify-end space-x-2">
                        <button onClick={() => setStockPage(stockPage - 1)} disabled={stockPage === 1} className="px-3 py-1 bg-gray-200 rounded">Prev</button>
                        <button onClick={() => setStockPage(stockPage + 1)} disabled={stockPage * itemsPerPage >= filteredStockItems.length} className="px-3 py-1 bg-gray-200 rounded">Next</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TenantDetailsPage;
