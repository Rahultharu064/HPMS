import React, { useState, useEffect } from 'react';
import { Search, FileText, Calendar, DollarSign, User } from 'lucide-react';
import { bookingService } from '../../../services/bookingService';
import extraServiceService from '../../../services/extraServiceService';
import toast from 'react-hot-toast';

const GuestFolio = () => {
    const [bookings, setBookings] = useState([]);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [bookingDetails, setBookingDetails] = useState(null);
    const [extraServices, setExtraServices] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchBookings();
    }, []);

    useEffect(() => {
        if (selectedBooking) {
            fetchBookingDetails(selectedBooking);
        }
    }, [selectedBooking]);

    const fetchBookings = async () => {
        try {
            setLoading(true);
            const [confirmed, completed] = await Promise.all([
                bookingService.getAllBookings({ status: 'confirmed', limit: 100 }),
                bookingService.getAllBookings({ status: 'completed', limit: 100 })
            ]);

            const allBookings = [...(confirmed?.data || []), ...(completed?.data || [])];
            setBookings(allBookings);
        } catch (error) {
            console.error('Error fetching bookings:', error);
            toast.error('Failed to load bookings');
        } finally {
            setLoading(false);
        }
    };

    const fetchBookingDetails = async (bookingId) => {
        try {
            setLoading(true);
            const response = await bookingService.getBookingById(bookingId);
            const details = response?.booking || response;
            setBookingDetails(details);

            const services = await extraServiceService.getBookingExtraServices(bookingId);
            setExtraServices(Array.isArray(services) ? services : []);
        } catch (error) {
            console.error('Error fetching booking details:', error);
            toast.error('Failed to load booking details');
        } finally {
            setLoading(false);
        }
    };

    const calculateRoomCharges = () => {
        if (!bookingDetails) return 0;
        const checkIn = new Date(bookingDetails.checkIn);
        const checkOut = new Date(bookingDetails.checkOut);
        const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
        const roomRate = bookingDetails.room?.roomTypeRef?.basePrice || bookingDetails.room?.price || 0;
        return nights * roomRate;
    };

    const calculateServicesTotal = () => {
        return extraServices.reduce((total, service) => total + Number(service.totalPrice || 0), 0);
    };

    const calculateGrandTotal = () => {
        return calculateRoomCharges() + calculateServicesTotal();
    };

    const getNights = () => {
        if (!bookingDetails) return 0;
        const checkIn = new Date(bookingDetails.checkIn);
        const checkOut = new Date(bookingDetails.checkOut);
        return Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    };

    const filteredBookings = bookings.filter(booking => {
        const guestName = `${booking.guest?.firstName || ''} ${booking.guest?.lastName || ''}`.toLowerCase();
        const bookingId = `BK-${String(booking.id).padStart(4, '0')}`;
        const query = searchQuery.toLowerCase();
        return guestName.includes(query) || bookingId.includes(query) || booking.room?.roomNumber?.includes(query);
    });

    const handlePrint = () => {
        window.print();
    };

    return (
        <>
            <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-full-width {
            grid-column: 1 / -1 !important;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
            <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 bg-white rounded-xl shadow-md p-6 no-print">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <FileText size={20} className="text-blue-600" />
                            Select Booking
                        </h3>

                        <div className="relative mb-4">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by guest, room, or booking ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="space-y-2 max-h-[600px] overflow-y-auto">
                            {loading && <p className="text-gray-500 text-center py-4">Loading...</p>}
                            {!loading && filteredBookings.length === 0 && (
                                <p className="text-gray-500 text-center py-4">No bookings found</p>
                            )}
                            {filteredBookings.map((booking) => (
                                <div
                                    key={booking.id}
                                    onClick={() => setSelectedBooking(booking.id)}
                                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${selectedBooking === booking.id
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 hover:border-blue-300'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-semibold text-gray-900">
                                                {booking.guest?.firstName} {booking.guest?.lastName}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                BK-{String(booking.id).padStart(4, '0')}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-medium text-gray-700">
                                                Room {booking.room?.roomNumber}
                                            </p>
                                            <span
                                                className={`inline-block px-2 py-1 text-xs rounded-full ${booking.status === 'confirmed'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-gray-100 text-gray-800'
                                                    }`}
                                            >
                                                {booking.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6 print-full-width">
                        {!selectedBooking ? (
                            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                                <FileText size={64} className="mb-4" />
                                <p className="text-lg">Select a booking to view folio</p>
                            </div>
                        ) : loading ? (
                            <div className="flex items-center justify-center py-20">
                                <p className="text-gray-500">Loading folio...</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="border-b pb-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                                <User size={24} className="text-blue-600" />
                                                {bookingDetails?.guest?.firstName} {bookingDetails?.guest?.lastName}
                                            </h2>
                                            <p className="text-gray-600">
                                                Booking ID: BK-{String(bookingDetails?.id).padStart(4, '0')}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-gray-600">Room {bookingDetails?.room?.roomNumber}</p>
                                            <p className="text-sm text-gray-600">
                                                {bookingDetails?.room?.roomTypeRef?.name || bookingDetails?.room?.roomType}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mt-4">
                                        <div className="flex items-center gap-2 text-sm">
                                            <Calendar size={16} className="text-gray-500" />
                                            <span className="text-gray-600">Check-in:</span>
                                            <span className="font-medium">
                                                {new Date(bookingDetails?.checkIn).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <Calendar size={16} className="text-gray-500" />
                                            <span className="text-gray-600">Check-out:</span>
                                            <span className="font-medium">
                                                {new Date(bookingDetails?.checkOut).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                        <DollarSign size={20} className="text-green-600" />
                                        Room Charges
                                    </h3>
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-gray-700">
                                                {bookingDetails?.room?.roomTypeRef?.name || bookingDetails?.room?.roomType} × {getNights()} night(s)
                                            </span>
                                            <span className="font-semibold text-gray-900">
                                                Rs. {calculateRoomCharges().toLocaleString()}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500">
                                            @ Rs. {bookingDetails?.room?.roomTypeRef?.basePrice || bookingDetails?.room?.price || 0} per night
                                        </p>
                                    </div>
                                </div>

                                {extraServices.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                            <DollarSign size={20} className="text-purple-600" />
                                            Extra Services
                                        </h3>
                                        <div className="space-y-2">
                                            {extraServices.map((service) => (
                                                <div
                                                    key={service.id}
                                                    className="bg-gray-50 rounded-lg p-4 flex justify-between items-center"
                                                >
                                                    <div>
                                                        <p className="font-semibold text-gray-900">
                                                            {service.extraService?.name}
                                                        </p>
                                                        <p className="text-sm text-gray-600">
                                                            {service.extraService?.description}
                                                        </p>
                                                        <div className="flex items-center gap-3 mt-1">
                                                            <span className="px-2 py-1 bg-gray-200 text-xs rounded">
                                                                {service.extraService?.category?.name}
                                                            </span>
                                                            <span className="text-sm text-gray-600">
                                                                Qty: {service.quantity} × Rs. {service.unitPrice}
                                                            </span>
                                                            <span className="text-xs text-gray-500">
                                                                {new Date(service.createdAt).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <span className="font-semibold text-gray-900">
                                                        Rs. {Number(service.totalPrice).toLocaleString()}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-3 pt-3 border-t flex justify-between items-center">
                                            <span className="font-medium text-gray-700">Services Subtotal:</span>
                                            <span className="font-bold text-gray-900">
                                                Rs. {calculateServicesTotal().toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                <div className="border-t-2 border-gray-300 pt-4">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-2xl font-bold text-gray-900">Grand Total:</h3>
                                        <p className="text-3xl font-bold text-blue-600">
                                            Rs. {calculateGrandTotal().toLocaleString()}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4 no-print">
                                    <button
                                        onClick={handlePrint}
                                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        Print Folio
                                    </button>
                                    <button className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                                        Email to Guest
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default GuestFolio;
