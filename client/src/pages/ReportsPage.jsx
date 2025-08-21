import React, { useState } from 'react';
import api from '../api';
import {
  FiDownload, FiBarChart2, FiDollarSign, FiShoppingBag,
  FiTrendingUp, FiBox, FiAlertTriangle, FiUsers,
  FiCheckCircle, FiXCircle, FiShield, FiCalendar, FiFileText
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';

const ReportStatCard = ({ title, value, icon }) => (
  <div className="bg-white p-4 rounded-xl shadow-md flex items-center space-x-4 min-w-0">
    <div className="text-2xl text-indigo-500 bg-indigo-100 p-3 rounded-full flex-shrink-0">
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-sm text-gray-500 truncate">{title}</p>
      <p className="text-xl font-bold text-gray-800 break-words">{value}</p>
    </div>
  </div>
);

const ReportsPage = () => {
  const [reportType, setReportType] = useState('sales');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleReportTypeChange = (e) => {
    setReportType(e.target.value);
    setReportData(null);
  };

  const handleGenerateReport = async () => {
    setLoading(true);
    setReportData(null);
    setIsMobileMenuOpen(false); // Close mobile menu after generating report

    let url = '';
    let params = { month, year };
    switch (reportType) {
      case 'sales':
        url = '/api/reports/sales-data';
        break;
      case 'inventory':
        url = '/api/reports/inventory-data';
        params = {};
        break;
      case 'attendance':
        url = '/api/reports/attendance-data';
        break;
      case 'user-permissions':
        url = '/api/reports/user-permissions';
        params = {};
        break;
      default:
        toast.error("Invalid report type selected.");
        setLoading(false);
        return;
    }

    try {
      const response = await api.get(url, { params });
      setReportData(response.data);
      toast.success(`Report generated successfully!`);
    } catch {
      toast.error('Could not generate report. No data found.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    toast.info("Preparing your PDF download...");
    try {
      const response = await api.get(`/api/reports/sales-pdf?month=${month}&year=${year}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `sales-report-${year}-${month}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      toast.error('Could not download PDF.');
    }
  };

  const renderReportContent = () => {
    if (!reportData) return null;

    switch (reportType) {
      case 'sales':
        return (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">📊 Sales Summary</h2>
                <p className="text-indigo-600 font-semibold">{reportData.period}</p>
              </div>
              <button
                onClick={handleDownloadPDF}
                className="bg-green-500 text-white px-4 py-3 rounded-full flex items-center justify-center gap-2 hover:bg-green-600 shadow-lg self-start sm:self-auto"
              >
                <FiDownload className="text-sm" /> 
                <span className="hidden xs:inline">Download PDF</span>
                <span className="xs:hidden">PDF</span>
              </button>
            </div>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <ReportStatCard title="Total Sales" value={`$${reportData.totalSales}`} icon={<FiDollarSign />} />
              <ReportStatCard title="Total Orders" value={reportData.totalOrders} icon={<FiShoppingBag />} />
              <ReportStatCard title="Avg. Order Value" value={`$${reportData.averageOrderValue}`} icon={<FiTrendingUp />} />
            </div>
          </>
        );
      case 'inventory':
        return (
          <>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">📦 Inventory Summary</h2>
            <p className="text-indigo-600 font-semibold">As of today</p>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <ReportStatCard title="Total Products" value={reportData.totalProducts} icon={<FiBox />} />
              <ReportStatCard title="Low Stock Items" value={reportData.lowStockCount} icon={<FiAlertTriangle />} />
              <ReportStatCard title="Total Stock Value" value={`$${reportData.totalStockValue}`} icon={<FiDollarSign />} />
            </div>
          </>
        );
      case 'attendance':
        return (
          <>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">🧑‍💼 Attendance Summary</h2>
            <p className="text-indigo-600 font-semibold">{reportData.period}</p>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <ReportStatCard title="Total Employees" value={reportData.totalEmployees} icon={<FiUsers />} />
              <ReportStatCard title="Present Records" value={reportData.presentRecords} icon={<FiCheckCircle />} />
              <ReportStatCard title="Absent/Leave" value={reportData.absentRecords + reportData.leaveRecords} icon={<FiXCircle />} />
            </div>
          </>
        );
      case 'user-permissions':
        return (
          <>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">🛡️ User Permissions Report</h2>
            <p className="text-indigo-600 font-semibold">Full system access overview</p>
            <div className="mt-6 overflow-x-auto max-h-[60vh]">
              <div className="min-w-[600px]">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="p-3 text-left font-semibold">User</th>
                      <th className="p-3 text-left font-semibold">Roles</th>
                      <th className="p-3 text-left font-semibold">Effective Permissions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {reportData.map(user => (
                      <tr key={user._id}>
                        <td className="p-3 font-medium">
                          <div>{user.username}</div>
                          <div className="text-xs text-gray-500 truncate max-w-[120px] xs:max-w-[200px] sm:max-w-none">{user.email}</div>
                        </td>
                        <td className="p-3">
                          <div className="max-w-[100px] xs:max-w-[150px] sm:max-w-none truncate">{user.roles}</div>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1 max-w-[150px] xs:max-w-[200px] sm:max-w-none">
                            {user.permissions.map(p => (
                              <span key={p} className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full truncate">{p}</span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-100 min-h-screen p-4 sm:p-6 md:p-8 lg:p-10">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 md:mb-10 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 flex items-center justify-center gap-2 sm:gap-3">
            <FiBarChart2 className="text-indigo-600" /> 
            <span>Reports & Analytics</span>
          </h1>
          <p className="text-gray-600 mt-2 sm:mt-3 text-base sm:text-lg">Generate, analyze, and download key business reports.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Mobile Control Panel Toggle */}
          <div className="lg:hidden mb-4">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="w-full bg-indigo-600 text-white px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 shadow-md"
            >
              <FiFileText className="text-lg" />
              {isMobileMenuOpen ? 'Hide Controls' : 'Show Report Controls'}
            </button>
          </div>

          {/* Sidebar Control Panel */}
          <div className={`lg:col-span-1 ${isMobileMenuOpen ? 'block' : 'hidden'} lg:block`}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/80 backdrop-blur-lg p-5 sm:p-6 rounded-2xl shadow-xl border border-gray-200"
            >
              <h2 className="text-xl font-bold text-gray-700 mb-4 sm:mb-6 flex items-center gap-2">
                <FiCalendar className="text-indigo-500" /> Control Panel
              </h2>
              <div className="space-y-4 sm:space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Report</label>
                  <select
                    value={reportType}
                    onChange={handleReportTypeChange}
                    className="p-3 border rounded-lg w-full bg-white focus:ring-2 focus:ring-indigo-400"
                  >
                    <option value="sales">Monthly Sales Report</option>
                    <option value="inventory">Inventory Summary</option>
                    <option value="attendance">Monthly Attendance</option>
                    <option value="user-permissions">User Permissions</option>
                  </select>
                </div>

                {(reportType === 'sales' || reportType === 'attendance') && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
                      <select
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                        className="p-3 border rounded-lg w-full bg-white focus:ring-2 focus:ring-indigo-400"
                      >
                        {[...Array(12).keys()].map(i => (
                          <option key={i + 1} value={i + 1}>
                            {new Date(0, i).toLocaleString('default', { month: 'long' })}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                      <input
                        type="number"
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        className="p-3 border rounded-lg w-full focus:ring-2 focus:ring-indigo-400"
                        min="2000"
                        max="2100"
                      />
                    </div>
                  </>
                )}

                <button
                  onClick={handleGenerateReport}
                  disabled={loading}
                  className="w-full bg-indigo-600 text-white px-4 py-3 rounded-full font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 shadow-md disabled:opacity-50 transition text-sm sm:text-base"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </>
                  ) : (
                    <>
                      <FiBarChart2 className="text-sm" /> Generate Report
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>

          {/* Report Display */}
          <div className="lg:col-span-2 relative">
            <AnimatePresence>
              {reportData ? (
                <motion.div
                  key="report"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white/80 backdrop-blur-lg p-5 sm:p-6 md:p-8 rounded-2xl shadow-xl border border-gray-200 relative"
                >
                  {renderReportContent()}
                </motion.div>
              ) : (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-center bg-white/70 backdrop-blur-lg p-6 sm:p-8 md:p-10 rounded-2xl shadow-xl h-full text-center text-gray-500 min-h-[300px]"
                >
                  <div>
                    <FiBarChart2 className="text-4xl mx-auto text-indigo-300 mb-4" />
                    <p className="text-lg">Select a report from the control panel and click <span className="font-semibold text-indigo-600">Generate Report</span> to view results.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;