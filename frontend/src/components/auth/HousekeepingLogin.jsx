import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Shield, Lock, ArrowLeft, User } from 'lucide-react';
import authService from '../../services/authService';

const HousekeepingLogin = () => {
  const [formData, setFormData] = useState({
    accessCode: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const value = e.target.value;
    // Only allow alphanumeric characters and limit to 8 characters
    if (/^[a-zA-Z0-9]*$/.test(value) && value.length <= 8) {
      setFormData({ ...formData, [e.target.name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.loginHousekeeping(formData.accessCode);
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
            <p className="text-gray-300">Enter your 8-character access code</p>
          </div>

          {/* Access Code Display */}
          <div className="mb-8">
            <div className="flex justify-center space-x-2 mb-4">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
                <div
                  key={index}
                  className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center text-lg font-mono font-bold ${
                    index < formData.accessCode.length
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 border-emerald-400 text-white'
                      : 'bg-gray-700 border-gray-600 text-gray-400'
                  } transition-all duration-200`}
                >
                  {index < formData.accessCode.length ? formData.accessCode[index] : ''}
                </div>
              ))}
            </div>
            <div className="text-center text-sm text-gray-400">
              {formData.accessCode.length}/8 characters
            </div>
          </div>

          {/* Keypad */}
          <div className="grid grid-cols-6 gap-2 mb-6">
            {keypadChars.map((char) => (
              <button
                key={char}
                type="button"
                onClick={() => handleKeypadClick(char)}
                className="aspect-square bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white text-sm font-semibold transition-all duration-200 transform hover:scale-105 active:scale-95 backdrop-blur-sm"
              >
                {char}
              </button>
            ))}
            <div className="col-span-4"></div>
            <button
              type="button"
              onClick={handleBackspace}
              className="col-span-2 aspect-square bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-300 hover:text-red-200 transition-all duration-200 transform hover:scale-105 active:scale-95 backdrop-blur-sm"
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
            disabled={loading || formData.accessCode.length !== 8}
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
