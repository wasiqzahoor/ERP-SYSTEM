// src/App.jsx

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
// Public Pages
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';

// Common Components & Guards
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Tenant-specific (Normal User) Pages
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import InventoryPage from './pages/InventoryPage';
import EmployeesPage from './pages/EmployeesPage';
import SalesPage from './pages/SalesPage';
import AttendancePage from './pages/AttendancePage';
import CreateOrderPage from './pages/CreateOrderPage';
import CustomersPage from './pages/CustomersPage';



// Super Admin Pages
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import AddCompanyPage from './pages/AddCompanyPage';
import TenantDetailsPage from './pages/TenantDetailsPage';
import DepartmentsPage from './pages/DepartmentsPage';
import DepartmentDetailsPage from './pages/DepartmentDetailsPage';
import EmployeeProfilePage from './pages/EmployeeProfilePage';
import PayrollPage from './pages/PayrollPage';
import ActivityLogPage from './pages/ActivityLogPage';
import ReportsPage from './pages/ReportsPage';
import AddEmployeePage from './pages/AddEmployeePage';
import RoleEditorPage from './pages/RoleEditorPage';
import RolesPage from './pages/RolesPage';

function App() {
    const { user, loading } = useAuth();

    // Agar authentication state load ho rahi hai, toh kuch na render karein
    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <>
        <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
           
            <Route path="/" element={<Navigate to="/login" />} />

            {/* Protected Routes - Ye sab routes sirf logged-in users ke liye hain */}
            {/* isSuperAdmin ke hisab se routes ko conditionally render kiya gaya hai */}
            {user?.isSuperAdmin ? (
                // Super Admin specific routes
                <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                    <Route path="/superadmin/dashboard" element={<SuperAdminDashboard />} />
                    <Route path="/superadmin/add-company" element={<AddCompanyPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/superadmin/tenants/:tenantId" element={<TenantDetailsPage />} />
                    <Route path="*" element={<Navigate to="/superadmin/dashboard" replace />} />

                </Route>
            ) : (
                // Normal Tenant User routes
                <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/inventory" element={<InventoryPage />} />
                    <Route path="/hrm/employees" element={<EmployeesPage />} />
                    <Route path="/hrm/add-employee" element={<AddEmployeePage />} />
                    <Route path="/employees/:id" element={<EmployeeProfilePage />} />
                    <Route path="/hrm/payroll" element={<PayrollPage />} />
                    <Route path="/hrm/attendance" element={<AttendancePage />} />
                    <Route path="/sales" element={<SalesPage />} />
                    <Route path="/auditlog" element={<ActivityLogPage />} />
                    <Route path="/sales/create-order" element={<CreateOrderPage />} />
                    <Route path="/customers" element={<CustomersPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/departments" element={<DepartmentsPage />} />
                    <Route path="/reports" element={<ReportsPage />} />
                    <Route path="/departments/:id" element={<DepartmentDetailsPage />} />
                    <Route path="/settings/roles" element={<RolesPage />} />
                    <Route path="/settings/roles/new" element={<RoleEditorPage />} />
                    <Route path="/settings/roles/edit/:roleId" element={<RoleEditorPage />} />
                    
                    {/* Baqi sab unknown routes ko dashboard par redirect karein */}
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Route>
            )}
        </Routes>
         <ToastContainer
                position="bottom-right"
                autoClose={4000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="colored"
            />
        </>
    );
}

export default App;
