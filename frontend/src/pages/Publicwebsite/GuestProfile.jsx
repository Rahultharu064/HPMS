import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { User, Mail, Phone, Edit3, Save, X, LogOut, Camera, Shield, Calendar, CreditCard, MapPin, Clock } from 'lucide-react';
import authService from '../../services/authService';
import { API_BASE_URL } from '../../utils/api';
import Header from '../../components/Publicwebsite/Layout/Header';
import Footer from '../../components/Publicwebsite/Layout/Footer';

const GuestProfile = () => {
  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const navigate = useNavigate();

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }
    fetchProfile();
    fetchBookings();
  }, [navigate]);

  const fetchProfile = async () => {
    try {
      const data = await authService.getProfile();
      setProfile(data.guest);
      setFormData({
        firstName: data.guest.firstName || '',
        lastName: data.guest.lastName || '',
        phone: data.guest.phone || '',
      });
    } catch (err) {
      if (err.message.includes('Guest not found') || err.response?.status === 404) {
        toast.error('Your account was not found. Please log in again.');
        authService.logout();
        navigate('/login');
      } else {
        const errorMessage = err.response?.data?.error || err.message || 'Failed to load profile';
        toast.error(errorMessage);
      }
    }
  };

  const fetchBookings = async () => {
    try {
      const data = await authService.getUserBookings();
      setBookings(data.bookings || []);
    } catch (err) {
      if (err.message.includes('Guest not found') || err.response?.status === 404) {
        toast.error('Your account was not found. Please log in again.');
        authService.logout();
        navigate('/login');
      } else {
        const errorMessage = err.response?.data?.error || err.message || 'Failed to load bookings';
        toast.error(errorMessage);
      }
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await authService.updateProfile(formData);
      setProfile(data.guest);
      toast.success('Profile updated successfully!');
      setEditing(false);
    } catch (err) {
      if (err.message.includes('Guest not found') || err.response?.status === 404) {
        toast.error('Your account was not found. Please log in again.');
        authService.logout();
        navigate('/login');
      } else {
        toast.error(err.response?.data?.error || 'Update failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setUploadingPhoto(true);
    try {
      await authService.uploadPhoto(file);
      toast.success('Profile photo updated successfully!');
      await fetchProfile(); // Refresh profile data
    } catch (err) {
      if (err.message.includes('Guest not found') || err.response?.status === 404) {
        toast.error('Your account was not found. Please log in again.');
        authService.logout();
        navigate('/login');
      } else {
        toast.error('Failed to upload photo');
      }
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
      case 'checked_in':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Header />
      <Toaster position="top-right" />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg">
                      {profile.photoUrl ? (
                        <img
                          src={`${API_BASE_URL}${profile.photoUrl}`}
                          alt="Profile"
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-10 h-10 text-indigo-600" />
                      )}
                    </div>
                    <label className="absolute bottom-0 right-0 bg-indigo-500 hover:bg-indigo-600 text-white p-2 rounded-full cursor-pointer transition-colors shadow-lg">
                      <Camera className="w-4 h-4" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                        disabled={uploadingPhoto}
                      />
                    </label>
                    {uploadingPhoto && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                      </div>
                    )}
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-white">
                      {`${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Guest'}
                    </h1>
                    <p className="text-indigo-100 flex items-center">
                      <Shield className="w-4 h-4 mr-1" />
                      Guest Account
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors shadow-lg"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
              <nav className="flex">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'profile'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Profile Information
                </button>
                <button
                  onClick={() => setActiveTab('bookings')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'bookings'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  My Bookings ({bookings.length})
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-8">
              {activeTab === 'profile' && (
                <>
                  {!editing ? (
                    <div className="space-y-6">
                      {/* Profile Information Cards */}
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                          <div className="flex items-center space-x-3 mb-3">
                            <User className="w-5 h-5 text-indigo-600" />
                            <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <label className="text-sm font-medium text-gray-500">First Name</label>
                              <p className="text-gray-900 font-medium">{profile.firstName || 'N/A'}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-500">Last Name</label>
                              <p className="text-gray-900 font-medium">{profile.lastName || 'N/A'}</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                          <div className="flex items-center space-x-3 mb-3">
                            <Mail className="w-5 h-5 text-indigo-600" />
                            <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <label className="text-sm font-medium text-gray-500">Email Address</label>
                              <p className="text-gray-900 font-medium">{profile.email || 'N/A'}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-500">Phone Number</label>
                              <p className="text-gray-900 font-medium">{profile.phone || 'Not provided'}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Account Information */}
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Account Status</h3>
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="text-green-700 font-medium">Active Account</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                          Member since {new Date(profile.createdAt || Date.now()).toLocaleDateString()}
                        </p>
                      </div>

                      {/* Action Button */}
                      <div className="flex justify-center pt-4">
                        <button
                          onClick={() => setEditing(true)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl flex items-center space-x-2 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                          <Edit3 className="w-5 h-5" />
                          <span>Edit Profile</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            First Name *
                          </label>
                          <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Last Name *
                          </label>
                          <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                        />
                      </div>

                      <div className="flex space-x-4 pt-4">
                        <button
                          type="submit"
                          disabled={loading}
                          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-6 rounded-xl flex items-center justify-center space-x-2 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loading ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          ) : (
                            <Save className="w-5 h-5" />
                          )}
                          <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditing(false)}
                          className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 px-6 rounded-xl flex items-center justify-center space-x-2 transition-all shadow-lg hover:shadow-xl"
                        >
                          <X className="w-5 h-5" />
                          <span>Cancel</span>
                        </button>
                      </div>
                    </form>
                  )}
                </>
              )}

              {activeTab === 'bookings' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">My Bookings</h2>
                    <span className="text-sm text-gray-500">{bookings.length} total bookings</span>
                  </div>

                  {bookings.length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
                      <p className="text-gray-500">You haven't made any bookings yet.</p>
                    </div>
                  ) : (
                    <div className="grid gap-6">
                      {bookings.map((booking) => (
                        <div key={booking.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-start space-x-4">
                              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                                <MapPin className="w-6 h-6 text-indigo-600" />
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {booking.room?.name || 'Room'} - {booking.room?.roomNumber}
                                </h3>
                                <p className="text-sm text-gray-600">{booking.room?.roomType}</p>
                              </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                              {booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1)}
                            </span>
                          </div>

                          <div className="grid md:grid-cols-3 gap-4 mb-4">
                            <div className="flex items-center space-x-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">Check-in</p>
                                <p className="text-sm text-gray-600">{formatDate(booking.checkIn)}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">Check-out</p>
                                <p className="text-sm text-gray-600">{formatDate(booking.checkOut)}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <CreditCard className="w-4 h-4 text-gray-400" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">Total Amount</p>
                                <p className="text-sm text-gray-600">NPR{booking.finalAmount || booking.totalAmount}</p>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-sm text-gray-600">
                            <span>Guests: {booking.adults} adults, {booking.children} children</span>
                            <span>Booked on {formatDate(booking.createdAt)}</span>
                          </div>

                          {/* Show package/promotion/coupon if applied */}
                          {(booking.package || booking.promotion || booking.coupon) && (
                            <div className="mt-4 pt-4 border-t border-gray-100">
                              <div className="flex flex-wrap gap-2">
                                {booking.package && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    Package: {booking.package.name}
                                  </span>
                                )}
                                {booking.promotion && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Promotion: {booking.promotion.name}
                                  </span>
                                )}
                                {booking.coupon && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                    Coupon: {booking.coupon.code}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Show extra services if any */}
                          {booking.extraServices && booking.extraServices.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-100">
                              <p className="text-sm font-medium text-gray-900 mb-2">Extra Services:</p>
                              <div className="flex flex-wrap gap-2">
                                {booking.extraServices.map((service, index) => (
                                  <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                    {service.extraService?.name} (x{service.quantity})
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default GuestProfile;
