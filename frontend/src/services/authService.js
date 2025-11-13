import api from '../utils/api';
import { apiRequest } from '../utils/api';

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
    const response = await api.get('/api/auth/guest/profile');
    return response;
  },

  updateProfile: async (data) => {
    const response = await api.put('/api/auth/guest/profile', data);
    return response;
  },

  uploadPhoto: async (file) => {
    const formData = new FormData();
    formData.append('photo', file);
    const response = await apiRequest('/api/auth/guest/upload-photo', {
      method: 'POST',
      body: formData
    });
    return response;
  },

  getUserBookings: async () => {
    const response = await api.get('/api/auth/guest/bookings');
    return response;
  },

  forgotPassword: async (email) => {
    const response = await api.post('/api/auth/guest/forgot-password', { email });
    return response;
  },

  resetPassword: async (token, newPassword) => {
    const response = await api.post('/api/auth/guest/reset-password', { token, newPassword });
    return response;
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
