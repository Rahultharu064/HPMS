import React, { useState, useEffect } from 'react';
import { Plus, Minus, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import extraServiceService from '../../../services/extraServiceService';

const ExtraServices = ({ bookingId, onServicesChange }) => {
  const [availableServices, setAvailableServices] = useState([]);
  const [bookingServices, setBookingServices] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAvailableServices();
    if (bookingId) {
      fetchBookingServices();
    }
  }, [bookingId]);

  const fetchAvailableServices = async () => {
    try {
      const response = await extraServiceService.getExtraServices();
      setAvailableServices(response.data || []);
    } catch (error) {
      console.error('Error fetching extra services:', error);
      toast.error('Failed to load extra services');
    }
  };

  const fetchBookingServices = async () => {
    if (!bookingId || isNaN(parseInt(bookingId))) {
      setBookingServices([]);
      return;
    }
    try {
      const response = await extraServiceService.getBookingExtraServices(bookingId);
      setBookingServices(response.data || []);
      if (onServicesChange) {
        onServicesChange(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching booking services:', error);
      toast.error('Failed to load booking services');
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

  const getTotalExtraServicesCost = () => {
    return bookingServices.reduce((total, service) => total + Number(service.totalPrice), 0);
  };

  return (
    <div className="space-y-6">
      {/* Available Services */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Available Extra Services</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableServices.map((service) => (
            <div key={service.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold">{service.name}</h4>
                <span className="px-2 py-1 bg-gray-100 text-xs rounded">{service.category}</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{service.description}</p>
              <div className="flex justify-between items-center">
                <span className="font-bold text-lg">Rs. {service.price}</span>
                <button
                  onClick={() => addServiceToBooking(service.id)}
                  disabled={loading}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4 inline mr-1" />
                  Add
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Booking Services */}
      {bookingServices.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Added Services</h3>
            <span className="text-lg font-bold">
              Total: Rs. {getTotalExtraServicesCost()}
            </span>
          </div>
          <div className="space-y-4">
            {bookingServices.map((service) => (
              <div key={service.id} className="flex items-center justify-between border rounded-lg p-4">
                <div className="flex-1">
                  <h4 className="font-semibold">{service.extraService.name}</h4>
                  <p className="text-sm text-gray-600">{service.extraService.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-1 bg-gray-200 text-xs rounded">{service.extraService.category}</span>
                    <span className="text-sm">Unit: Rs. {service.unitPrice}</span>
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
                    Rs. {service.totalPrice}
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
        </div>
      )}
    </div>
  );
};

export default ExtraServices;
