import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Hash, Shield, Lock, ArrowLeft } from 'lucide-react';
import authService from '../../services/authService';

const StaffLogin = () => {
  const [formData, setFormData] = useState({
    pin: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const value = e.target.value;
    // Only allow numeric input and limit to 4 digits
    if (/^\d*$/.test(value) && value.length <= 4) {
      setFormData({ ...formData, [e.target.name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.loginStaff(formData.pin);
      navigate('/frontoffice'); // Redirect to front office dashboard
    } catch (err) {
      const errorMessage = err.message || 'Staff login failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleKeypadClick = (digit) => {
    if (formData.pin.length < 4) {
      setFormData({ ...formData, pin: formData.pin + digit });
    }
  };

  const handleBackspace = () => {
    setFormData({ ...formData, pin: formData.pin.slice(0, -1) });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-500/20 to-blue-500/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md mx-auto">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Hash className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Staff Login</h2>
            <p className="text-gray-300">Enter your 4-digit PIN to continue</p>
          </div>

          {/* PIN Display */}
          <div className="mb-8">
            <div className="flex justify-center space-x-4 mb-4">
              {[0, 1, 2, 3].map((index) => (
                <div
                  key={index}
                  className={`w-4 h-4 rounded-full ${
                    index < formData.pin.length
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500'
                      : 'bg-gray-600'
                  } transition-colors duration-200`}
                />
              ))}
            </div>
            <div className="text-center text-sm text-gray-400">
              {formData.pin.length}/4 digits
            </div>
          </div>

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleKeypadClick(digit.toString())}
                className="aspect-square bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white text-xl font-semibold transition-all duration-200 transform hover:scale-105 active:scale-95 backdrop-blur-sm"
              >
                {digit}
              </button>
            ))}
            <div></div>
            <button
              type="button"
              onClick={() => handleKeypadClick('0')}
              className="aspect-square bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white text-xl font-semibold transition-all duration-200 transform hover:scale-105 active:scale-95 backdrop-blur-sm"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              className="aspect-square bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-xl text-red-300 hover:text-red-200 transition-all duration-200 transform hover:scale-105 active:scale-95 backdrop-blur-sm"
            >
              ⌫
            </button>
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
            onClick={handleSubmit}
            disabled={loading || formData.pin.length !== 4}
            className="w-full flex justify-center py-4 px-6 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] mb-4"
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

export default StaffLogin;
