import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X, Sun, Moon, Bell, ChevronDown, Settings, Shield, LogOut, User, Menu, Camera, Check } from 'lucide-react'
import { toast } from 'react-hot-toast'
import authService from '../../../services/authService'
import { notificationsService } from '../../../services/notificationsService'
import { getSocket } from '../../../utils/socket'
import { API_BASE_URL } from '../../../utils/api'

const Header = ({ darkMode, setDarkMode, sidebarOpen, setSidebarOpen, notifications, searchQuery, setSearchQuery }) => {
  const [adminProfile, setAdminProfile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [notificationList, setNotificationList] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAdminProfile = async () => {
      try {
        const response = await authService.getAdminProfile();
        setAdminProfile(response.admin);
      } catch (error) {
        console.error('Failed to fetch admin profile:', error);
      }
    };

    fetchAdminProfile();

    // Fetch initial notifications
    const fetchNotifications = async () => {
      try {
        const response = await notificationsService.list();
        setNotificationList(response.notifications || []);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };

    fetchNotifications();

    // Set up Socket.IO listeners for real-time notifications
    const socket = getSocket();
    if (socket) {
      socket.on('notification:new', (data) => {
        setNotificationList(prev => [data.notification, ...prev]);
      });
    }

    // Cleanup socket listeners on unmount
    return () => {
      if (socket) {
        socket.off('notification:new');
      }
    };
  }, []);

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate('/admin/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Force logout even if API call fails
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/admin/login');
    }
  };

  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file.');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB.');
      return;
    }

    setUploading(true);
    try {
      const response = await authService.uploadAdminPhoto(file);
      // Refresh admin profile to get updated photoUrl
      const profileResponse = await authService.getAdminProfile();
      setAdminProfile(profileResponse.admin);
      toast.success('Profile photo uploaded successfully!');
    } catch (error) {
      console.error('Failed to upload photo:', error);
      toast.error('Failed to upload photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleProfileClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <header className={`${darkMode ? 'bg-gray-800/80 backdrop-blur-lg' : 'bg-white/80 backdrop-blur-lg'} border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} sticky top-0 z-40`}>
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left Section - Logo and Menu */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-2 rounded-2xl ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'} transition-colors`}
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center overflow-hidden bg-white">
              <img src="/INCHOTEL.png" alt="IncStay Logo" className="w-full h-full object-contain" />
            </div>
            <div className="hidden sm:block">
              <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>INCHOTEL</h1>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Admin Portal</p>
            </div>
          </div>
        </div>

        {/* Centered Search Bar */}
        <div className="flex-1 max-w-2xl mx-2 sm:mx-4 md:mx-8">
          <div className="relative">
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} size={20} />
            <input
              type="text"
              placeholder="Search rooms, guests, bookings, reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-12 pr-4 py-2 sm:py-3 rounded-2xl border-2 text-sm sm:text-base ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'} focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-lg bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Right Section - Actions and Profile */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-3 rounded-2xl ${darkMode ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'} transition-colors`}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-3 rounded-2xl bg-gray-100 hover:scale-105 transition-transform"
            >
              <Bell size={20} className={darkMode ? 'text-gray-300' : 'text-gray-600'} />
              {notificationList.filter(n => !n.read).length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                  {notificationList.filter(n => !n.read).length}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-y-auto">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
                </div>
                <div className="p-2">
                  {notificationList.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                      No notifications yet
                    </div>
                  ) : (
                    notificationList.slice(0, 10).map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 rounded-xl mb-2 ${notification.read ? 'bg-gray-50 dark:bg-gray-700' : 'bg-blue-50 dark:bg-blue-900/20'} border-l-4 ${notification.type === 'booking' ? 'border-l-blue-500' : 'border-l-green-500'}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {new Date(notification.createdAt).toLocaleString()}
                            </p>
                          </div>
                          {!notification.read && (
                            <button
                              onClick={() => {
                                // Mark as read functionality
                                setNotificationList(prev =>
                                  prev.map(n =>
                                    n.id === notification.id ? { ...n, read: true } : n
                                  )
                                );
                              }}
                              className="ml-2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
                            >
                              <Check size={14} className="text-green-600" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile Dropdown */}
          <div className={`flex items-center gap-3 px-4 py-2 rounded-2xl ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} cursor-pointer transition-colors group relative`}>
            <div className="relative">
              {adminProfile?.photoUrl ? (
                <img
                  src={`${API_BASE_URL}${adminProfile.photoUrl}?t=${Date.now()}`}
                  alt="Admin Profile"
                  className="w-8 h-8 rounded-xl object-cover cursor-pointer"
                  onClick={handleProfileClick}
                />
              ) : (
                <div
                  className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-semibold cursor-pointer"
                  onClick={handleProfileClick}
                >
                  {adminProfile ? getInitials(adminProfile.firstName, adminProfile.lastName) : 'PA'}
                </div>
              )}
              {/* Camera overlay */}
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={12} className="text-white" />
              </div>
              {uploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-2xl flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
            <div className="hidden md:block">
              <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {adminProfile ? `${adminProfile.firstName} ${adminProfile.lastName}` : 'Priya Admin'}
              </p>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Administrator</p>
            </div>
            <ChevronDown size={16} className={darkMode ? 'text-gray-400' : 'text-gray-500'} />

            {/* Dropdown Menu */}
            <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <p className="font-semibold text-gray-900 dark:text-white">
                  {adminProfile ? `${adminProfile.firstName} ${adminProfile.lastName}` : 'Priya Admin'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{adminProfile?.email || 'priya@hamrostay.com'}</p>
              </div>
              <div className="p-2">
                {[
                  { icon: User, label: 'Profile' },
                  { icon: Settings, label: 'Settings' },
                  { icon: Shield, label: 'Security' }
                ].map((item, idx) => (
                  <button key={idx} className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <item.icon size={18} className="text-gray-500 dark:text-gray-400" />
                    <span className="text-gray-700 dark:text-gray-300">{item.label}</span>
                  </button>
                ))}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors mt-2"
                >
                  <LogOut size={18} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
