import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import authService from '../../services/authService';

const ProtectedStaffRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [isStaff, setIsStaff] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        const user = authService.getUser();

        if (!token || !user) {
          setIsAuthenticated(false);
          setIsStaff(false);
          return;
        }

        // Check if user is front office staff
        if (user.role === 'front_office_staff') {
          setIsAuthenticated(true);
          setIsStaff(true);
        } else {
          setIsAuthenticated(false); // Treat non-staff users as not authenticated for staff routes
          setIsStaff(false);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
        setIsStaff(false);
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

  // If not authenticated, redirect to staff login
  if (!isAuthenticated) {
    return <Navigate to="/staff/login" replace />;
  }

  // If authenticated but not staff, redirect to guest login
  if (!isStaff) {
    return <Navigate to="/login" replace />;
  }

  // If authenticated and staff, render the protected component
  return children;
};

export default ProtectedStaffRoute;
