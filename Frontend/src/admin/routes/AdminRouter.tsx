import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import AdminLoginPage from '../pages/AdminLoginPage';
import AdminDashboard from '../pages/AdminDashboard';
import AdminProtectedRoute from './AdminProtectedRoute';
import adminAPI from '../api/adminAPI';

const AdminRouter: React.FC = () => {
  const navigate = useNavigate();
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(
    localStorage.getItem('adminToken') !== null
  );

  const handleAdminLogin = async (email: string, password: string) => {
    try {
      const response = await adminAPI.auth.login({ email, password });
      
      if (response.success) {
        localStorage.setItem('adminToken', response.token);
        localStorage.setItem('adminUser', JSON.stringify(response.admin));
        setIsAdminAuthenticated(true);
        navigate('/admin/dashboard');
      } else {
        alert(response.message || 'Login failed');
      }
    } catch (error: any) {
      console.error('Admin login error:', error);
      const errorMessage = error.response?.data?.message || 'Login failed. Please try again.';
      alert(errorMessage);
    }
  };

  const handleBackToUser = () => {
    navigate('/');
  };

  const handleAdminLogout = async () => {
    try {
      await adminAPI.auth.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      setIsAdminAuthenticated(false);
      navigate('/admin/login');
    }
  };

  return (
    <Routes>
      <Route 
        path="/login" 
        element={
          isAdminAuthenticated ? (
            <Navigate to="/admin/dashboard" replace />
          ) : (
            <AdminLoginPage 
              onLogin={handleAdminLogin} 
              onBackToUser={handleBackToUser} 
            />
          )
        } 
      />
      <Route 
        path="/dashboard" 
        element={
          <AdminProtectedRoute>
            <AdminDashboard onLogout={handleAdminLogout} />
          </AdminProtectedRoute>
        } 
      />
      <Route path="/" element={<Navigate to="/admin/login" replace />} />
      <Route path="*" element={<Navigate to="/admin/login" replace />} />
    </Routes>
  );
};

export default AdminRouter;
