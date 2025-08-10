// src/App.jsx

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import RequestsPage from './pages/RequestsPage';
import ProtectedRoute from './components/ProtectedRoute';
import WaitingPage from './pages/WaitingPage';
import Layout from './components/Layout';
import ProfilePage from './pages/ProfilePage'; // <-- Import
import AddManagerPage from './pages/AddManagerPage'; // <-- Import
import ForgotPasswordPage from './pages/ForgotPasswordPage';

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/waiting-for-approval/:userId" element={<WaitingPage />} />
      <Route path="/" element={<LoginPage />} />
       <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      {/* Protected Routes with Navbar */}
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/requests" element={<RequestsPage />} />
        
        {/* ADD THESE NEW ROUTES */}
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/add-manager" element={<AddManagerPage />} />
        
      </Route>
    </Routes>
  );
}

export default App;