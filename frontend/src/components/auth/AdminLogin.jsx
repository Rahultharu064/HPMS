import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Shield, Lock, ArrowLeft, Mail, Key, CheckCircle } from 'lucide-react';
import authService from '../../services/authService';
import AdminPasswordSetup from './AdminPasswordSetup';

const AdminLogin = () => {
  const [step, setStep] = useState('email'); // 'email', 'otp', 'password'
  const [formData, setFormData] = useState({
    email: '',
    otp: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [requiresPasswordSetup, setRequiresPasswordSetup] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.requestAdminOtp(formData.email);
      setStep('otp');
      // Check if OTP is already verified after sending
      setTimeout(() => {
        checkOtpVerification();
      }, 1000); // Small delay to allow backend to process
    } catch (err) {
      const errorMessage = err.message || 'Failed to send OTP';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const checkOtpVerification = async () => {
    if (!formData.email) return;

    try {
      const response = await authService.checkAdminOtpStatus(formData.email);
      setRequiresPasswordSetup(response.requiresPasswordSetup);
      setStep('password');
    } catch (err) {
      // If not verified, stay on current step
      console.log('OTP not verified yet');
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.verifyAdminOtp(formData.email, formData.otp);
      setRequiresPasswordSetup(response.requiresPasswordSetup);
      setStep('password');
    } catch (err) {
      const errorMessage = err.message || 'OTP verification failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setStep('email');
    setError('');
    setFormData({ ...formData, otp: '' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md mx-auto">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Admin Access</h2>
            <p className="text-gray-300">
              {step === 'email' ? 'Enter your email to receive OTP' : step === 'otp' ? 'Enter the OTP sent to your email' : 'Set up your password'}
            </p>
          </div>

          {/* Form */}
          {step === 'email' ? (
            <form onSubmit={handleRequestOtp} className="space-y-6">
              {/* Email Field */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Admin Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    name="email"
                    type="email"
                    required
                    className="block w-full pl-12 pr-4 py-3 border border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-gray-800/50 backdrop-blur-sm text-white placeholder-gray-400"
                    placeholder="Enter admin email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>

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
                    Sending OTP...
                  </div>
                ) : (
                  'Send OTP'
                )}
              </button>
            </form>
          ) : step === 'otp' ? (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              {/* OTP Field */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  OTP Code
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Key className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    name="otp"
                    type={showOtp ? 'text' : 'password'}
                    required
                    maxLength="6"
                    className="block w-full pl-12 pr-12 py-3 border border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-gray-800/50 backdrop-blur-sm text-white placeholder-gray-400 text-center text-2xl font-mono tracking-widest"
                    placeholder="000000"
                    value={formData.otp}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                    onClick={() => setShowOtp(!showOtp)}
                  >
                    {showOtp ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-200" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-200" />
                    )}
                  </button>
                </div>
              </div>

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
                    Verifying...
                  </div>
                ) : (
                  'Verify & Login'
                )}
              </button>

              {/* Back Button */}
              <button
                type="button"
                onClick={handleBackToEmail}
                className="w-full flex justify-center py-3 px-6 border border-gray-600 rounded-xl text-sm font-semibold text-gray-300 hover:text-white hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200"
              >
                Back to Email
              </button>
            </form>
          ) : (
            <AdminPasswordSetup
              email={formData.email}
              requiresPasswordSetup={requiresPasswordSetup}
              onBack={handleBackToEmail}
            />
          )}

          {/* Back to Login */}
          <div className="text-center mt-8">
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

export default AdminLogin;
