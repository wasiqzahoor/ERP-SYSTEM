// src/pages/AttendancePage.jsx

import React, { useState, useEffect, useRef, useMemo } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { FiUpload, FiDownload, FiCheck, FiArrowRight, FiCalendar, FiUsers, FiFilter } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import Select from 'react-select';
import AttendanceSummary from '../components/AttendanceSummary';

const AttendancePage = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [attendance, setAttendance] = useState({});
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(true);
    const fileInputRef = useRef(null);
    const [uploading, setUploading] = useState(false);

    const userRoles = useMemo(() => user?.roles.map(r => r.name) || [], [user]);
    const isAdmin = useMemo(() => userRoles.includes('Admin'), [userRoles]);
    const isManager = useMemo(() => userRoles.includes('Manager'), [userRoles]);

    const [selectedDepartment, setSelectedDepartment] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    
    const fetchData = async () => {
        if (!date || !user || !user.roles) { // <-- Yahan !user.roles ka check add karein
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const attendanceMap = {};
            
            // User ke roles ko yahan function ke andar check karein
            const localUserRoles = user.roles.map(r => r.name);
            const localIsAdmin = localUserRoles.includes('Admin');
            const localIsManager = localUserRoles.includes('Manager');
            const localIsEmployeeOnly = !localIsAdmin && !localIsManager;

            if (localIsEmployeeOnly) {
                // Case 1: Agar user sirf Employee hai
                setUsers([user]);
                const attendanceRes = await api.get(`/api/hrm/my-attendance?date=${date}`);
                if (attendanceRes.data.length > 0) {
                    attendanceMap[user._id] = attendanceRes.data[0];
                }

            } else {
                // Case 2: Agar user Admin ya Manager hai
                const [usersRes, attendanceRes] = await Promise.all([
                    api.get('/api/users'),
                    api.get(`/api/hrm/attendance/by-date?date=${date}`)
                ]);
                
                setUsers(usersRes.data.users);
                
                attendanceRes.data.forEach(record => {
                    const userId = record.user?._id || record.user;
                    if (userId) attendanceMap[userId] = record;
                });
            }
            
            setAttendance(attendanceMap);
        } catch (err) {
            toast.error('Failed to load attendance data.');
            console.error(err); // Error ko console mein bhi dekhein
        } finally {
            setLoading(false);
        }
    };
const todayString = new Date().toISOString().split('T')[0];
    useEffect(() => { fetchData(); }, [date, user]);

    const handleMarkAttendance = async (userId, status) => {
        try {
            await api.post('/api/hrm/attendance', { userId, date, status });
            toast.success(`Attendance marked as ${status}.`);
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || `Failed to mark attendance.`);
            fetchData();
        }
    };
    
    // --- CSV UPLOAD KE LIYE FUNCTIONS ---
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            handleUpload(file);
        }
    };

    const handleUpload = async (file) => {
        setUploading(true);
        const formData = new FormData();
        formData.append('attendanceCsv', file);
        try {
            await api.post('/api/hrm/attendance/upload-csv', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            fetchData();
            toast.success('CSV uploaded successfully!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Upload failed!');
        } finally {
            setUploading(false);
            if(fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    // --- Export Function ---
    const handleExportAttendance = async () => {
        const [year, month] = date.split('-');
        try {
            const res = await api.get(`/api/hrm/attendance/export?month=${month}&year=${year}`, { responseType: 'blob' });
            const blob = new Blob([res.data], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `attendance_report_${year}-${month}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            toast.success('Attendance report exported!');
        } catch(error) {
            toast.error('Could not export data.');
            console.error(error);
        }
    };

     const filteredAndGroupedUsers = useMemo(() => {
        let usersToDisplay = users;
        if (isManager && !isAdmin) {
            usersToDisplay = users.filter(u => u.department?._id === user.department?._id);
        }
        
        const filtered = usersToDisplay.filter(u => {
            const matchesDepartment = !selectedDepartment || u.department?._id === selectedDepartment.value;
            const matchesSearch = u.username.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesDepartment && matchesSearch;
        });

        return filtered.reduce((acc, u) => {
            const deptName = u.department?.name || 'Unassigned';
            if (!acc[deptName]) acc[deptName] = [];
            acc[deptName].push(u);
            return acc;
        }, {});
    }, [users, selectedDepartment, searchQuery, isManager, isAdmin, user]);

    const departmentOptions = useMemo(() => {
        const depts = users.reduce((acc, u) => {
            if (u.department) acc[u.department._id] = u.department.name;
            return acc;
        }, {});
        return Object.entries(depts).map(([value, label]) => ({ value, label }));
    }, [users]);
    
    return (
        <div className="bg-gray-50 min-h-screen p-8">
            <div className="container mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 bg-white p-6 rounded-xl shadow-lg">
                    <div>
                        <h1 className="text-4xl font-extrabold text-gray-900">Attendance Dashboard</h1>
                        <p className="text-gray-600 mt-2">Manage daily attendance and view employee status.</p>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 mt-4 md:mt-0">
                        {/* Date Picker */}
                        <div className="flex items-center bg-gray-100 p-2 rounded-lg">
                            <FiCalendar className="text-gray-500 mr-2" />
                            <input
                                type="date"
                                id="attendance-date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="bg-transparent text-gray-800 font-medium outline-none cursor-pointer"
                            />
                        </div>
                        
                        {/* CSV Actions */}
                        {(isAdmin || isManager) && (
                            <>
                                <button
                                    onClick={() => fileInputRef.current.click()}
                                    disabled={uploading}
                                    className="bg-green-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-green-700 flex items-center gap-2 disabled:opacity-50 transition-colors shadow-md"
                                >
                                    {uploading ? 'Uploading...' : <><FiUpload /> Upload CSV</>}
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    className="hidden"
                                    accept=".csv"
                                />
                                <button
                                    onClick={handleExportAttendance}
                                    className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 flex items-center gap-2 transition-colors shadow-md"
                                >
                                    <FiDownload /> Export
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <AttendanceSummary attendanceData={Object.values(attendance)} totalUsers={users.length} />

                {isAdmin && (
                    <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-white rounded-xl shadow-md">
                        <div className="flex items-center gap-2 flex-grow">
                            <FiFilter className="text-gray-500" />
                            <Select
                                options={departmentOptions}
                                onChange={setSelectedDepartment}
                                value={selectedDepartment}
                                isClearable
                                placeholder="Filter by Department..."
                                className="w-full md:w-64"
                            />
                        </div>
                        <div className="flex items-center gap-2 flex-grow">
                            <FiUsers className="text-gray-500" />
                            <input
                                type="text"
                                placeholder="Search by name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="p-2 border rounded-md w-full"
                            />
                        </div>
                    </div>
                )}
                
                <div className="space-y-6">
                    {loading ? (
                        <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div></div>
                    ) : (
                        Object.entries(filteredAndGroupedUsers).map(([deptName, deptUsers]) => (
                             <motion.div key={deptName} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-xl shadow-lg">
                                <h2 className="text-2xl font-bold mb-4 text-gray-800 border-b pb-3">{deptName}</h2>
                                <div className="divide-y divide-gray-100">
                                    {deptUsers.map(emp => {
                                        const record = attendance[emp._id];
                                        
                                        let status;
                                        if (record) {
                                            status = record.status;
                                        } else {
                                            if (date < todayString) {
                                                status = 'Absent';
                                            } else {
                                                status = 'Not Marked';
                                            }
                                        }
                                        
                                        const isSelf = emp._id === user._id;
                                        const canMarkOwnPresent = status === 'Not Marked' && isSelf;
                                        const canMarkTeamLeave = status === 'Not Marked' && isManager && emp.department?._id === user.department?._id && !isSelf;

                                        return (
                                            <div key={emp._id} className="py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                                                <div className="flex items-center w-full sm:w-auto sm:flex-grow">
                                                    <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${emp.username}`} alt="avatar" className="w-10 h-10 rounded-full mr-4" />
                                                    <div>
                                                        <p className="font-semibold text-gray-900">{emp.username}</p>
                                                        <p className="text-sm text-gray-500">{emp.email}</p>
                                                    </div>
                                                </div>
                                                
                                                {/* --- YEH NAYI AUR BEHTAR UI LOGIC HAI --- */}
                                                <div className="flex items-center gap-3 flex-shrink-0">
                                                    {/* Step 1: Status Badge/Text hamesha dikhayein */}
                                                    <div className={`px-3 py-1 rounded-full text-xs font-bold w-24 text-center ${
                                                        status === 'Present' ? 'bg-green-100 text-green-800' :
                                                        status === 'Leave' ? 'bg-yellow-100 text-yellow-800' :
                                                        status === 'Absent' ? 'bg-red-100 text-red-800' :
                                                        'bg-gray-100 text-gray-600' // 'Not Marked' ke liye
                                                    }`}>
                                                        {status}
                                                    </div>

                                                    {/* Step 2: Action Buttons sirf tab dikhayein jab zaroorat ho */}
                                                    {canMarkOwnPresent && (
                                                        <button onClick={() => handleMarkAttendance(emp._id, 'Present')} title="Mark Present" className="p-2 rounded-full text-white bg-green-500 hover:bg-green-600 shadow-sm"><FiCheck size={20} /></button>
                                                    )}
                                                    {canMarkTeamLeave && (
                                                        <button onClick={() => handleMarkAttendance(emp._id, 'Leave')} title="Mark Leave" className="p-2 rounded-full text-white bg-yellow-500 hover:bg-yellow-600 shadow-sm"><FiArrowRight size={20} /></button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
 
export default AttendancePage;