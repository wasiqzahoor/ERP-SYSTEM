// src/pages/ActivityLogPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import { toast } from 'react-toastify';
import { FiChevronLeft, FiChevronRight, FiFilter, FiPlusCircle, FiEdit, FiTrash2, FiX, FiCalendar } from 'react-icons/fi';
import Select from 'react-select';
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css'; // main style file
import 'react-date-range/dist/theme/default.css'; // theme css file
import { motion, AnimatePresence } from 'framer-motion';

// Action ke liye ek chota component
const ActionBadge = ({ action }) => {
    const config = {
        Created: { icon: <FiPlusCircle />, color: 'bg-green-100 text-green-800' },
        Updated: { icon: <FiEdit />, color: 'bg-blue-100 text-blue-800' },
        Deleted: { icon: <FiTrash2 />, color: 'bg-red-100 text-red-800' },
    };
    const { icon, color } = config[action] || {};
    return (
        <span className={`inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium ${color}`}>
            {icon} {action}
        </span>
    );
};

const ActivityLogPage = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Filter states
    const [filterOptions, setFilterOptions] = useState({ users: [], modules: [] });
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedModule, setSelectedModule] = useState(null);
    const [dateRange, setDateRange] = useState([
        { startDate: null, endDate: null, key: 'selection' }
    ]);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showFilters, setShowFilters] = useState(false); // For mobile filter toggle

    const datePickerRef = useRef(null);

    // Handle clicks outside date picker
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
                setShowDatePicker(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Fetch filter options (users, modules)
    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const res = await api.get('/api/logs/filters');
                setFilterOptions({
                    users: res.data.users.map(u => ({ value: u._id, label: u.username })),
                    modules: res.data.modules.map(m => ({ value: m, label: m }))
                });
            } catch (err) {
                toast.error("Could not load filter options.");
            }
        };
        fetchOptions();
    }, []);
    
    // Fetch logs jab page ya filters change hon
    useEffect(() => {
        const fetchLogs = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams({ page: currentPage });
                if (selectedUser) params.append('user', selectedUser.value);
                if (selectedModule) params.append('module', selectedModule.value);
                if (dateRange[0].startDate) params.append('startDate', dateRange[0].startDate.toISOString());
                if (dateRange[0].endDate) params.append('endDate', dateRange[0].endDate.toISOString());

                const res = await api.get(`/api/logs?${params.toString()}`);
                setLogs(Array.isArray(res.data.logs) ? res.data.logs : []);
                setCurrentPage(res.data.currentPage || 1);
                setTotalPages(res.data.totalPages || 1);
            } catch (err) {
                toast.error('Failed to load activity logs.');
                setLogs([]);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, [currentPage, selectedUser, selectedModule, dateRange]);

    // Clear all filters
    const clearFilters = () => {
        setSelectedUser(null);
        setSelectedModule(null);
        setDateRange([{ startDate: null, endDate: null, key: 'selection' }]);
    };

    // Check if any filter is active
    const hasActiveFilters = selectedUser || selectedModule || dateRange[0].startDate;

    return (
        <div className="bg-gray-50 min-h-screen p-4 md:p-6 lg:p-8">
            <div className="container mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800">Activity Log</h1>
                    
                    {/* Mobile filter toggle */}
                    <button 
                        onClick={() => setShowFilters(!showFilters)}
                        className="md:hidden flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200"
                    >
                        <FiFilter /> Filters
                        {hasActiveFilters && (
                            <span className="bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                !
                            </span>
                        )}
                    </button>
                </div>

                {/* --- FILTER CONTROL PANEL --- */}
                <AnimatePresence>
                    {(showFilters || !showFilters) && ( // Always render on desktop, conditionally on mobile
                        <motion.div 
                            className={`bg-white p-4 rounded-xl shadow-md mb-6 space-y-4 ${showFilters ? 'block' : 'hidden md:block'}`}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div className="flex justify-between items-center mb-2">
                                <h2 className="text-lg font-medium text-gray-700">Filters</h2>
                                <div className="flex gap-2">
                                    {hasActiveFilters && (
                                        <button 
                                            onClick={clearFilters}
                                            className="text-sm text-blue-500 hover:text-blue-700"
                                        >
                                            Clear All
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => setShowFilters(false)}
                                        className="md:hidden text-gray-500"
                                    >
                                        <FiX size={18} />
                                    </button>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
                                    <Select 
                                        options={filterOptions.users} 
                                        isClearable 
                                        placeholder="Filter by User..." 
                                        value={selectedUser}
                                        onChange={setSelectedUser} 
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Module</label>
                                    <Select 
                                        options={filterOptions.modules} 
                                        isClearable 
                                        placeholder="Filter by Module..." 
                                        value={selectedModule}
                                        onChange={setSelectedModule} 
                                    />
                                </div>
                                <div className="relative" ref={datePickerRef}>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                                    <button 
                                        onClick={() => setShowDatePicker(!showDatePicker)} 
                                        className="w-full p-2 border rounded-md text-left flex items-center justify-between bg-white"
                                    >
                                        <span>
                                            {dateRange[0].startDate 
                                                ? `${dateRange[0].startDate.toLocaleDateString()} - ${dateRange[0].endDate.toLocaleDateString()}`
                                                : "Select date range..."
                                            }
                                        </span>
                                        <FiCalendar className="text-gray-500" />
                                    </button>
                                    {showDatePicker && (
                                        <div className="absolute top-full left-0 right-0 md:right-auto z-20 mt-1 shadow-xl">
                                            <DateRange
                                                editableDateInputs={true}
                                                onChange={item => { 
                                                    setDateRange([item.selection]); 
                                                    if (window.innerWidth < 768) {
                                                        setShowDatePicker(false);
                                                    }
                                                }}
                                                moveRangeOnFirstSelection={false}
                                                ranges={dateRange}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                
                <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
                    {/* Table for desktop */}
                    <table className="w-full hidden md:table">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="p-4 text-left">User</th>
                                <th className="p-4 text-left">Action</th>
                                <th className="p-4 text-left">Module</th>
                                <th className="p-4 text-left">Timestamp</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {loading ? (
                                <tr><td colSpan="4" className="text-center p-6">Loading...</td></tr>
                            ) : logs.length > 0 ? (
                                logs.map((log, index) => (
                                    <motion.tr 
                                        key={log._id}
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <img 
                                                    src={log.user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${log.user?.username || '?'}`} 
                                                    alt="avatar" 
                                                    className="w-8 h-8 rounded-full" 
                                                />
                                                <span>{log.user ? log.user.username : 'Unknown User'}</span>
                                            </div>
                                        </td>
                                        <td className="p-4"><ActionBadge action={log.action} /></td>
                                        <td className="p-4">{log.module}</td>
                                        <td className="p-4 text-sm text-gray-500">{new Date(log.createdAt).toLocaleString()}</td>
                                    </motion.tr>
                                ))
                            ) : (
                                <tr><td colSpan="4" className="text-center p-6">No activity logs found</td></tr>
                            )}
                        </tbody>
                    </table>

                    {/* Cards for mobile */}
                    <div className="md:hidden">
                        {loading ? (
                            <div className="text-center p-6">Loading...</div>
                        ) : logs.length > 0 ? (
                            logs.map((log, index) => (
                                <motion.div 
                                    key={log._id}
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="p-4 border-b border-gray-200"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-3">
                                            <img 
                                                src={log.user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${log.user?.username || '?'}`} 
                                                alt="avatar" 
                                                className="w-8 h-8 rounded-full" 
                                            />
                                            <span className="font-medium">{log.user ? log.user.username : 'Unknown User'}</span>
                                        </div>
                                        <ActionBadge action={log.action} />
                                    </div>
                                    <div className="flex justify-between items-center mt-2">
                                        <span className="text-sm text-gray-600">{log.module}</span>
                                        <span className="text-xs text-gray-500">{new Date(log.createdAt).toLocaleString()}</span>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="text-center p-6">No activity logs found</div>
                        )}
                    </div>
                </div>

                {/* --- PAGINATION CONTROLS --- */}
                {totalPages > 1 && (
                    <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <span className="text-sm text-gray-700">Page {currentPage} of {totalPages}</span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                                disabled={currentPage === 1 || loading}
                                className="p-2 rounded-md hover:bg-gray-200 disabled:opacity-50 transition-colors"
                                aria-label="Previous page"
                            >
                                <FiChevronLeft />
                            </button>
                            
                            {/* Page numbers - show limited on mobile */}
                            <div className="hidden sm:flex items-center gap-1">
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    const pageNum = currentPage <= 3 
                                        ? i + 1 
                                        : currentPage >= totalPages - 2 
                                            ? totalPages - 4 + i 
                                            : currentPage - 2 + i;
                                    
                                    if (pageNum > 0 && pageNum <= totalPages) {
                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={`w-8 h-8 rounded-md text-sm ${currentPage === pageNum ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'}`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    }
                                    return null;
                                })}
                                
                                {totalPages > 5 && currentPage < totalPages - 2 && (
                                    <span className="px-1">...</span>
                                )}
                                
                                {totalPages > 5 && currentPage < totalPages - 2 && (
                                    <button
                                        onClick={() => setCurrentPage(totalPages)}
                                        className={`w-8 h-8 rounded-md text-sm ${currentPage === totalPages ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'}`}
                                    >
                                        {totalPages}
                                    </button>
                                )}
                            </div>
                            
                            <button
                                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                                disabled={currentPage === totalPages || loading}
                                className="p-2 rounded-md hover:bg-gray-200 disabled:opacity-50 transition-colors"
                                aria-label="Next page"
                            >
                                <FiChevronRight />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActivityLogPage;