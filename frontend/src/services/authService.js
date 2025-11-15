import api, { apiRequest } from '../utils/api';

const authService = {
  register: async (data) => {
    const response = await api.post('/api/auth/guest/register', data);
    return response;
  },

  login: async (data) => {
    const response = await api.post('/api/auth/guest/login', data);
    if (response.token) {
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.guest));
    }
    return response;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getProfile: async () => {
    try {
      const response = await api.get('/api/auth/guest/profile');
      return response;
    } catch (error) {
      if (error.message.includes('Guest not found') || error.response?.status === 404) {
        // Clear local storage and throw specific error
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        throw new Error('Guest not found');
      }
      throw error;
    }
  },

  updateProfile: async (data) => {
    try {
      const response = await api.put('/api/auth/guest/profile', data);
      return response;
    } catch (error) {
      if (error.message.includes('Guest not found') || error.response?.status === 404) {
        // Clear local storage and throw specific error
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        throw new Error('Guest not found');
      }
      throw error;
    }
  },

  uploadPhoto: async (file) => {
    try {
      const formData = new FormData();
      formData.append('photo', file);
      const response = await apiRequest('/api/auth/guest/upload-photo', {
        method: 'POST',
        body: formData
      });
      return response;
    } catch (error) {
      if (error.message.includes('Guest not found') || error.response?.status === 404) {
        // Clear local storage and throw specific error
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        throw new Error('Guest not found');
      }
      throw error;
    }
  },

  getUserBookings: async () => {
    try {
      const response = await api.get('/api/auth/guest/bookings');
      return response;
    } catch (error) {
      if (error.message.includes('Guest not found') || error.response?.status === 404) {
        // Clear local storage and throw specific error
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        throw new Error('Guest not found');
      }
      throw error;
    }
  },

  forgotPassword: async (email) => {
    const response = await api.post('/api/auth/guest/forgot-password', { email });
    return response;
  },

  resetPassword: async (token, newPassword) => {
    const response = await api.post('/api/auth/guest/reset-password', { token, newPassword });
    return response;
  },

  requestAdminOtp: async (email) => {
    const response = await api.post('/api/auth/admin/request-otp', { email });
    return response;
  },

  verifyAdminOtp: async (email, otp) => {
    const response = await api.post('/api/auth/admin/verify-otp', { email, otp });
    return response;
  },

  checkAdminOtpStatus: async (email) => {
    const response = await api.post('/api/auth/admin/verify-otp', { email });
    return response;
  },

  setupAdminPassword: async (email, password) => {
    const response = await api.post('/api/auth/admin/setup-password', { email, password });
    if (response.token) {
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    return response;
  },

  loginAdminWithPassword: async (email, password) => {
    const response = await api.post('/api/auth/admin/login-password', { email, password });
    if (response.token) {
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    return response;
  },

  loginStaff: async (email, password) => {
    const response = await api.post('/api/auth/staff/login', { email, password });
    if (response.token) {
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    return response;
  },

  changeStaffPassword: async (newPassword) => {
    const response = await api.put('/api/auth/staff/change-password', { newPassword });
    return response;
  },

  changeHousekeepingPassword: async (newPassword) => {
    const response = await api.put('/api/auth/housekeeping/change-password', { newPassword });
    return response;
  },

  showToast: (message, type = 'success') => {
    // This will be used to show toast notifications
    // The actual implementation will be in components that use this service
    console.log(`${type}: ${message}`);
  },

  loginHousekeeping: async (email, password) => {
    const response = await api.post('/api/auth/housekeeping/login', { email, password });
    if (response.token) {
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    return response;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getAdminProfile: async () => {
    try {
      const response = await api.get('/api/auth/admin/profile');
      return response;
    } catch (error) {
      console.error('Failed to fetch admin profile:', error);
      throw error;
    }
  },

  uploadAdminPhoto: async (file) => {
    try {
      const formData = new FormData();
      formData.append('photo', file);
      const response = await apiRequest('/api/auth/admin/upload-photo', {
        method: 'POST',
        body: formData
      });
      return response;
    } catch (error) {
      console.error('Failed to upload admin photo:', error);
      throw error;
    }
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  getUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
};

export default authService;
