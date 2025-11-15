import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import authService from '../../services/authService';

const ProtectedHousekeepingRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [isHousekeeper, setIsHousekeeper] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        const user = authService.getUser();

        if (!token || !user) {
          setIsAuthenticated(false);
          setIsHousekeeper(false);
          return;
        }

        // Check if user is housekeeping staff
        if (user.type === 'housekeeper') {
          setIsAuthenticated(true);
          setIsHousekeeper(true);
        } else {
          setIsAuthenticated(false); // Treat non-housekeeping users as not authenticated for housekeeping routes
          setIsHousekeeper(false);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
        setIsHousekeeper(false);
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

  // If not authenticated, redirect to housekeeping login
  if (!isAuthenticated) {
    return <Navigate to="/housekeeping/login" replace />;
  }

  // If authenticated but not housekeeper, redirect to guest login
  if (!isHousekeeper) {
    return <Navigate to="/login" replace />;
  }

  // If authenticated and housekeeper, render the protected component
  return children;
};

export default ProtectedHousekeepingRoute;
