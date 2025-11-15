import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Shield, Lock, ArrowLeft, User } from 'lucide-react';
import authService from '../../services/authService';

const HousekeepingLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.loginHousekeeping(formData.email, formData.password);

      // Check if password change is required (first login)
      if (response.requiresPasswordChange) {
        navigate(`/staff/change-password?email=${formData.email}`);
        return;
      }

      navigate('/housekeeping'); // Redirect to housekeeping dashboard
    } catch (err) {
      const errorMessage = err.message || 'Housekeeping login failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleKeypadClick = (char) => {
    if (formData.accessCode.length < 8) {
      setFormData({ ...formData, accessCode: formData.accessCode + char });
    }
  };

  const handleBackspace = () => {
    setFormData({ ...formData, accessCode: formData.accessCode.slice(0, -1) });
  };

  const keypadChars = [
    'A', 'B', 'C', 'D', 'E', 'F',
    'G', 'H', 'I', 'J', 'K', 'L',
    'M', 'N', 'O', 'P', 'Q', 'R',
    'S', 'T', 'U', 'V', 'W', 'X',
    'Y', 'Z', '0', '1', '2', '3',
    '4', '5', '6', '7', '8', '9'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-teal-500/20 to-emerald-500/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-lg mx-auto">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Housekeeping Login</h2>
            <p className="text-gray-300">Enter your email and password</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent backdrop-blur-sm"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent backdrop-blur-sm"
                placeholder="Enter your password"
              />
            </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl text-sm mb-4">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-4 px-6 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] mb-4"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Authenticating...
              </div>
            ) : (
              'Login'
            )}
          </button>
        </form>

          {/* Back to Login */}
          <div className="text-center">
            <Link to="/login" className="inline-flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to Guest Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HousekeepingLogin;
