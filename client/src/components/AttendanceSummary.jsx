// src/components/AttendanceSummary.jsx

import React, { useMemo } from 'react';
import { FiCheckCircle, FiXCircle, FiArrowRightCircle, FiUsers } from 'react-icons/fi';
import { motion } from 'framer-motion';

const AttendanceSummary = ({ attendanceData, totalUsers }) => {
    const summary = useMemo(() => {
        // Ab 'attendanceData' ek array hai, isliye .map() theek kaam karega
        const statuses = attendanceData.map(record => record.status);
        const presentCount = statuses.filter(s => s === 'Present').length;
        const absentCount = statuses.filter(s => s === 'Absent').length;
        const leaveCount = statuses.filter(s => s === 'Leave').length;
        
        return { presentCount, absentCount, leaveCount };
    }, [attendanceData]);

    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: (i) => ({
            opacity: 1,
            y: 0,
            transition: { delay: i * 0.1 }
        })
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div custom={0} initial="hidden" animate="visible" variants={cardVariants} className="bg-white p-6 rounded-xl shadow-md flex items-center gap-4">
                <div className="p-3 rounded-full bg-blue-100 text-blue-600"><FiUsers size={24} /></div>
                <div><h3 className="text-xl font-bold text-gray-800">{totalUsers}</h3><p className="text-sm text-gray-500">Total Employees</p></div>
            </motion.div>
            <motion.div custom={1} initial="hidden" animate="visible" variants={cardVariants} className="bg-white p-6 rounded-xl shadow-md flex items-center gap-4">
                <div className="p-3 rounded-full bg-green-100 text-green-600"><FiCheckCircle size={24} /></div>
                <div><h3 className="text-xl font-bold text-gray-800">{summary.presentCount}</h3><p className="text-sm text-gray-500">Present</p></div>
            </motion.div>
            <motion.div custom={2} initial="hidden" animate="visible" variants={cardVariants} className="bg-white p-6 rounded-xl shadow-md flex items-center gap-4">
                <div className="p-3 rounded-full bg-red-100 text-red-600"><FiXCircle size={24} /></div>
                <div><h3 className="text-xl font-bold text-gray-800">{summary.absentCount}</h3><p className="text-sm text-gray-500">Absent</p></div>
            </motion.div>
            <motion.div custom={3} initial="hidden" animate="visible" variants={cardVariants} className="bg-white p-6 rounded-xl shadow-md flex items-center gap-4">
                <div className="p-3 rounded-full bg-yellow-100 text-yellow-600"><FiArrowRightCircle size={24} /></div>
                <div><h3 className="text-xl font-bold text-gray-800">{summary.leaveCount}</h3><p className="text-sm text-gray-500">On Leave</p></div>
            </motion.div>
        </div>
    );
};

export default AttendanceSummary;