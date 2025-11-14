import React, { useState } from 'react';
import { Eye, EyeOff, Lock, CheckCircle, ArrowLeft } from 'lucide-react';
import authService from '../../services/authService';

export default function AdminPasswordSetup({ email, requiresPasswordSetup, onBack }) {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSetupPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      await authService.setupAdminPassword(email, formData.password);
      // Redirect or handle success
      window.location.href = '/owner-admin/dashboard';
    } catch (err) {
      const errorMessage = err.message || 'Password setup failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginWithPassword = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.loginAdminWithPassword(email, formData.password);
      // Redirect or handle success
      window.location.href = '/owner-admin/dashboard';
    } catch (err) {
      const errorMessage = err.message || 'Admin login failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={requiresPasswordSetup ? handleSetupPassword : handleLoginWithPassword} className="space-y-6">
      {/* Password Field */}
      <div>
        <label className="block text-sm font-semibold text-white mb-2">
          {requiresPasswordSetup ? 'New Password' : 'Password'}
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Lock className="h-5 w-5 text-gray-400" />
          </div>
          <input
            name="password"
            type={showPassword ? 'text' : 'password'}
            required
            className="block w-full pl-12 pr-12 py-3 border border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-gray-800/50 backdrop-blur-sm text-white placeholder-gray-400"
            placeholder="Enter password"
            value={formData.password}
            onChange={handleChange}
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-4 flex items-center"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-200" />
            ) : (
              <Eye className="h-5 w-5 text-gray-400 hover:text-gray-200" />
            )}
          </button>
        </div>
      </div>

      {/* Confirm Password Field (only for setup) */}
      {requiresPasswordSetup && (
        <div>
          <label className="block text-sm font-semibold text-white mb-2">
            Confirm Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <CheckCircle className="h-5 w-5 text-gray-400" />
            </div>
            <input
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              required
              className="block w-full pl-12 pr-12 py-3 border border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-gray-800/50 backdrop-blur-sm text-white placeholder-gray-400"
              placeholder="Confirm password"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-4 flex items-center"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-200" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400 hover:text-gray-200" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full flex justify-center py-4 px-6 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-purple-600 hover:from-red-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            {requiresPasswordSetup ? 'Setting up...' : 'Logging in...'}
          </div>
        ) : (
          requiresPasswordSetup ? 'Set Password & Login' : 'Login'
        )}
      </button>

      {/* Back Button */}
      <button
        type="button"
        onClick={onBack}
        className="w-full flex justify-center py-3 px-6 border border-gray-600 rounded-xl text-sm font-semibold text-gray-300 hover:text-white hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200"
      >
        Back to Email
      </button>
    </form>
  );
}
