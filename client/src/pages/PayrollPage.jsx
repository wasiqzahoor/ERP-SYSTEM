import React, { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { FiDownload, FiDollarSign, FiCalendar, FiUser, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { toast } from 'react-toastify';

const PayrollPage = () => {
    const [payslips, setPayslips] = useState([]);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState('');
    
    // Mahina aur saal ke liye state, default aaj ka mahina/saal
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());

    const { hasPermission } = useAuth();

    const fetchPayslips = async () => {
        setLoading(true);
        setError('');
        try {
            console.log(`Fetching payslips for month: ${month}, year: ${year}`);
            const res = await api.get(`/api/payroll?month=${month}&year=${year}`);
            console.log('Payslips response:', res.data);
            setPayslips(res.data);
        } catch (error) {
            console.error("Failed to fetch payslips", error);
            console.error("Error response:", error.response?.data);
            toast.error(error.response?.data?.message || 'Could not load payslips for this period.');
            setPayslips([]);
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        fetchPayslips();
    }, [month, year]);

    const handleGenerate = async () => {
        setGenerating(true);
        setError('');
        try {
            const res = await api.post('/api/payroll/generate', { month, year });
            toast.success(res.data.message);
            fetchPayslips(); // Generate hone ke baad list ko refresh karein
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to generate payslips.');
        } finally {
            setGenerating(false);
        }
    };
    
    return (
        <div className="p-4 sm:p-6 md:p-8 bg-gray-100 min-h-screen">
            <div className="container mx-auto">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6">Payroll Management</h1>

                {/* Controls Section */}
                <div className="bg-white p-4 rounded-lg shadow-md mb-6">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto">
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <FiCalendar className="text-gray-500" />
                                <label className="font-semibold whitespace-nowrap">Month:</label>
                                <select 
                                    value={month} 
                                    onChange={(e) => setMonth(e.target.value)} 
                                    className="p-2 border rounded-md w-full sm:w-auto"
                                >
                                    {/* Months ke options */}
                                    {[...Array(12).keys()].map(i => (
                                        <option key={i+1} value={i+1}>
                                            {new Date(0, i).toLocaleString('default', { month: 'long' })}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <label className="font-semibold whitespace-nowrap">Year:</label>
                                <input 
                                    type="number" 
                                    value={year} 
                                    onChange={(e) => setYear(e.target.value)} 
                                    className="p-2 border rounded-md w-full sm:w-24" 
                                />
                            </div>
                        </div>
                        {hasPermission('salary:create') && (
                            <button 
                                onClick={handleGenerate} 
                                disabled={generating} 
                                className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold disabled:opacity-50 w-full md:w-auto flex items-center justify-center gap-2"
                            >
                                <FiDollarSign />
                                {generating ? 'Generating...' : 'Generate Payslips'}
                            </button>
                        )}
                    </div>
                </div>

                {error && <p className="text-red-500 text-center mb-4">{error}</p>}
                
                {/* Payslips Table */}
                <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="p-3 sm:p-4 text-left">Employee</th>
                                <th className="p-3 sm:p-4 text-right hidden sm:table-cell">Basic Salary</th>
                                <th className="p-3 sm:p-4 text-right hidden md:table-cell">Deductions</th>
                                <th className="p-3 sm:p-4 text-right hidden md:table-cell">Bonus</th>
                                <th className="p-3 sm:p-4 text-right font-bold">Net Salary</th>
                                <th className="p-3 sm:p-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="text-center p-6">
                                        <div className="flex justify-center">
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                                        </div>
                                        <p className="mt-2">Loading payslips...</p>
                                    </td>
                                </tr>
                            ) : payslips.length > 0 ? (
                                payslips.map(slip => (
                                    <tr key={slip._id} className="hover:bg-gray-50">
                                        <td className="p-3 sm:p-4">
                                            <div className="flex items-center gap-2">
                                                <FiUser className="text-gray-500 hidden sm:block" />
                                                <span className="font-semibold text-sm sm:text-base">{slip.user?.username || 'N/A'}</span>
                                            </div>
                                            <div className="sm:hidden text-xs text-gray-500 mt-1">
                                                Basic: ${slip.basicSalary.toFixed(2)} | 
                                                Deduct: ${slip.totalDeductions.toFixed(2)} | 
                                                Bonus: ${slip.bonus.toFixed(2)}
                                            </div>
                                        </td>
                                        <td className="p-3 sm:p-4 text-right hidden sm:table-cell">${slip.basicSalary.toFixed(2)}</td>
                                        <td className="p-3 sm:p-4 text-right text-red-500 hidden md:table-cell">${slip.totalDeductions.toFixed(2)}</td>
                                        <td className="p-3 sm:p-4 text-right text-green-500 hidden md:table-cell">${slip.bonus.toFixed(2)}</td>
                                        <td className="p-3 sm:p-4 text-right font-bold">${slip.netSalary.toFixed(2)}</td>
                                        <td className="p-3 sm:p-4 text-center">
                                            <button 
                                                className="text-blue-500 hover:text-blue-700 p-1 sm:p-2 bg-blue-50 rounded-full" 
                                                title="Download Payslip"
                                            >
                                                <FiDownload />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="text-center p-6 text-gray-500">
                                        <FiDollarSign className="mx-auto text-3xl mb-2 opacity-50" />
                                        <p>No payslips found for this period.</p>
                                        <p className="text-sm mt-1">Try generating them or select a different period.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls (if needed in future) */}
                {payslips.length > 0 && (
                    <div className="mt-6 flex justify-between items-center">
                        <span className="text-sm text-gray-700">
                            Showing {payslips.length} payslips
                        </span>
                        <div className="flex items-center gap-2">
                            <button className="p-2 rounded-md hover:bg-gray-200">
                                <FiChevronLeft />
                            </button>
                            <button className="p-2 rounded-md hover:bg-gray-200">
                                <FiChevronRight />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PayrollPage;