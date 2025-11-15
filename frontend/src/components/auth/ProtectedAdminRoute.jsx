import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import authService from '../../services/authService';

const ProtectedAdminRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [isAdmin, setIsAdmin] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        const user = authService.getUser();

        if (!token || !user) {
          setIsAuthenticated(false);
          setIsAdmin(false);
          return;
        }

        // Check if user is admin
        if (user.role === 'admin' || user.role === 'owner') {
          setIsAuthenticated(true);
          setIsAdmin(true);
        } else {
          setIsAuthenticated(false); // Treat non-admin users as not authenticated for admin routes
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
        setIsAdmin(false);
      }
    };

    checkAuth();
  }, []);

  // Show loading while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // If not authenticated, redirect to admin login
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  // If authenticated but not admin, redirect to guest login
  if (!isAdmin) {
    return <Navigate to="/login" replace />;
  }

  // If authenticated and admin, render the protected component
  return children;
};

export default ProtectedAdminRoute;
