import React, { useState, useEffect } from 'react';
import { Plus, Minus, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import extraServiceService from '../../../services/extraServiceService';
import serviceCategoryService from '../../../services/serviceCategoryService';

const ExtraServices = ({ bookingId, onServicesChange }) => {
  const [availableServices, setAvailableServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [bookingServices, setBookingServices] = useState([]);
  const [loading, setLoading] = useState(false);

  // Financial States
  const [allowDiscount, setAllowDiscount] = useState(false);
  const [discountPercent, setDiscountPercent] = useState(0);
  const taxPercent = 13; // Fixed GST 13%
  const serviceChargePercent = 10; // Fixed Service Charge 10%

  useEffect(() => {
    fetchCategories();
    fetchAvailableServices();
    if (bookingId) {
      fetchBookingServices();
    }
  }, [bookingId]);

  const fetchCategories = async () => {
    try {
      const response = await serviceCategoryService.getServiceCategories();
      console.log('Categories fetched:', response);
      setCategories(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error fetching service categories:', error);
      toast.error('Failed to load categories');
      setCategories([]);
    }
  };

  const fetchAvailableServices = async () => {
    try {
      const response = await extraServiceService.getExtraServices();
      setAvailableServices(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error fetching extra services:', error);
      toast.error('Failed to load extra services');
      setAvailableServices([]);
    }
  };

  const fetchBookingServices = async () => {
    if (!bookingId || isNaN(parseInt(bookingId))) {
      setBookingServices([]);
      return;
    }
    try {
      const response = await extraServiceService.getBookingExtraServices(bookingId);
      const services = Array.isArray(response) ? response : [];
      setBookingServices(services);
      if (onServicesChange) {
        onServicesChange(services);
      }
    } catch (error) {
      console.error('Error fetching booking services:', error);
      toast.error('Failed to load booking services');
      setBookingServices([]);
    }
  };

  const addServiceToBooking = async (serviceId, quantity = 1) => {
    if (!bookingId) {
      toast.error('Booking ID is required');
      return;
    }

    setLoading(true);
    try {
      await extraServiceService.addServiceToBooking(bookingId, serviceId, quantity);
      await fetchBookingServices();
      toast.success('Service added to booking');
    } catch (error) {
      console.error('Error adding service:', error);
      toast.error('Failed to add service');
    } finally {
      setLoading(false);
    }
  };

  const removeServiceFromBooking = async (bookingServiceId) => {
    setLoading(true);
    try {
      await extraServiceService.removeServiceFromBooking(bookingServiceId);
      await fetchBookingServices();
      toast.success('Service removed from booking');
    } catch (error) {
      console.error('Error removing service:', error);
      toast.error('Failed to remove service');
    } finally {
      setLoading(false);
    }
  };

  const updateServiceQuantity = async (bookingServiceId, newQuantity) => {
    if (newQuantity <= 0) {
      await removeServiceFromBooking(bookingServiceId);
      return;
    }

    // For quantity updates, we need to remove and re-add
    const service = bookingServices.find(bs => bs.id === bookingServiceId);
    if (!service) return;

    setLoading(true);
    try {
      await extraServiceService.removeServiceFromBooking(bookingServiceId);
      await extraServiceService.addServiceToBooking(bookingId, service.extraServiceId, newQuantity);
      await fetchBookingServices();
      toast.success('Service quantity updated');
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast.error('Failed to update quantity');
    } finally {
      setLoading(false);
    }
  };

  const getSubtotal = () => {
    return bookingServices.reduce((total, service) => total + Number(service.totalPrice), 0);
  };

  const getDiscountAmount = () => {
    if (!allowDiscount) return 0;
    return (getSubtotal() * discountPercent) / 100;
  };

  const getServiceChargeAmount = () => {
    const subtotal = getSubtotal();
    const discount = getDiscountAmount();
    return ((subtotal - discount) * serviceChargePercent) / 100;
  };

  const getTaxAmount = () => {
    const subtotal = getSubtotal();
    const discount = getDiscountAmount();
    const serviceCharge = getServiceChargeAmount();
    const taxableAmount = (subtotal - discount) + serviceCharge;
    return (taxableAmount * taxPercent) / 100;
  };

  const getGrandTotal = () => {
    const subtotal = getSubtotal();
    const discount = getDiscountAmount();
    const serviceCharge = getServiceChargeAmount();
    const tax = getTaxAmount();
    return (subtotal - discount) + serviceCharge + tax;
  };

  // Filter services by selected category
  const getServicesByCategory = () => {
    if (!selectedCategory) return [];
    return availableServices.filter(service => service.category?.id === parseInt(selectedCategory));
  };

  // Get selected service details
  const getSelectedServiceDetails = () => {
    if (!selectedService) return null;
    return availableServices.find(service => service.id === parseInt(selectedService));
  };

  // Handle category change - reset service selection
  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
    setSelectedService(''); // Reset service selection
  };

  // Handle service change
  const handleServiceChange = (e) => {
    setSelectedService(e.target.value);
  };

  // Handle adding service to booking
  const handleAddService = () => {
    if (!selectedService) return;
    addServiceToBooking(parseInt(selectedService), quantity);
    // Reset selections after adding
    setSelectedCategory('');
    setSelectedService('');
    setQuantity(1);
  };

  return (
    <div className="space-y-6">
      {/* Add Extra Services Form */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Add Extra Services</h3>

        {/* Category Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Category</label>
          <select
            value={selectedCategory}
            onChange={handleCategoryChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Choose a category...</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Service Selection */}
        {selectedCategory && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Service</label>
            <select
              value={selectedService}
              onChange={handleServiceChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a service...</option>
              {getServicesByCategory().map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Service Details and Add Button */}
        {selectedService && getSelectedServiceDetails() && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-semibold text-gray-900">{getSelectedServiceDetails().name}</h4>
                <p className="text-sm text-gray-600">{getSelectedServiceDetails().description}</p>
              </div>
              <div className="text-right">
                <span className="font-bold text-lg text-gray-900">NPR. {getSelectedServiceDetails().price}</span>
                <p className="text-xs text-gray-500">per unit</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Quantity:</label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Total:</span>
                <span className="font-bold text-gray-900">NPR. {(getSelectedServiceDetails().price * quantity).toLocaleString()}</span>
              </div>

              <button
                onClick={handleAddService}
                disabled={loading}
                className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add to Booking
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Booking Services */}
      {bookingServices.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Added Services</h3>
          </div>
          <div className="space-y-4">
            {bookingServices.map((service) => (
              <div key={service.id} className="flex items-center justify-between border rounded-lg p-4">
                <div className="flex-1">
                  <h4 className="font-semibold">{service.extraService.name}</h4>
                  <p className="text-sm text-gray-600">{service.extraService.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-1 bg-gray-200 text-xs rounded">{service.extraService.category?.name}</span>
                    <span className="text-sm">Unit: NPR. {service.unitPrice}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateServiceQuantity(service.id, service.quantity - 1)}
                      disabled={loading || service.quantity <= 1}
                      className="px-2 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center">{service.quantity}</span>
                    <button
                      onClick={() => updateServiceQuantity(service.id, service.quantity + 1)}
                      disabled={loading}
                      className="px-2 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="font-semibold w-20 text-right">
                    NPR. {service.totalPrice}
                  </span>
                  <button
                    onClick={() => removeServiceFromBooking(service.id)}
                    disabled={loading}
                    className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Financial Breakdown */}
          <div className="mt-6 border-t pt-4">
            {/* Discount Toggle */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4">
              <div className="flex items-center gap-4 mb-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowDiscount}
                    onChange={(e) => {
                      setAllowDiscount(e.target.checked);
                      if (!e.target.checked) setDiscountPercent(0);
                    }}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Allow Discount</span>
                </label>
              </div>

              {allowDiscount && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(Number(e.target.value))}
                    className="w-full max-w-xs p-2 border rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div className="text-xs text-gray-500 mt-3">
                <p>Service Charge: {serviceChargePercent}% (Fixed)</p>
                <p>GST: {taxPercent}% (Fixed)</p>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-gray-600">
                <span>Subtotal</span>
                <span>NPR. {getSubtotal().toLocaleString()}</span>
              </div>

              {allowDiscount && discountPercent > 0 && (
                <div className="flex justify-between items-center text-green-600">
                  <span>Discount ({discountPercent}%)</span>
                  <span>- NPR. {getDiscountAmount().toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between items-center text-gray-600">
                <span>Service Charge ({serviceChargePercent}%)</span>
                <span>+ NPR. {getServiceChargeAmount().toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center text-gray-600">
                <span>GST ({taxPercent}%)</span>
                <span>+ NPR. {getTaxAmount().toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center pt-2 border-t">
                <h3 className="text-xl font-bold text-gray-900">Grand Total:</h3>
                <p className="text-2xl font-bold text-blue-600">
                  NPR. {getGrandTotal().toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExtraServices;
