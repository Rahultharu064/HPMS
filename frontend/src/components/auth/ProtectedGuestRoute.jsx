import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import authService from '../../services/authService';

const ProtectedGuestRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [isGuest, setIsGuest] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        const user = authService.getUser();

        if (!token || !user) {
          setIsAuthenticated(false);
          setIsGuest(false);
          return;
        }

        // Check if user is a guest
        if (user.role === 'guest') {
          setIsAuthenticated(true);
          setIsGuest(true);
        } else {
          setIsAuthenticated(false); // Treat non-guest users as not authenticated for guest routes
          setIsGuest(false);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
        setIsGuest(false);
      }
    };

    checkAuth();
  }, []);

  // Show loading while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // If not authenticated, redirect to guest login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If authenticated but not guest, redirect to appropriate login
  if (!isGuest) {
    const user = authService.getUser();
    if (user?.role === 'admin' || user?.role === 'owner') {
      return <Navigate to="/admin/login" replace />;
    } else if (user?.role === 'front_office_staff') {
      return <Navigate to="/staff/login" replace />;
    } else if (user?.type === 'housekeeper') {
      return <Navigate to="/housekeeping/login" replace />;
    } else {
      return <Navigate to="/login" replace />;
    }
  }

  // If authenticated and guest, render the protected component
  return children;
};

export default ProtectedGuestRoute;
