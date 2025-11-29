import React, { useState, useEffect } from 'react';
import { Search, FileText, Calendar, DollarSign, User, CreditCard, X } from 'lucide-react';
import { bookingService } from '../../../services/bookingService';
import extraServiceService from '../../../services/extraServiceService';
import { paymentService } from '../../../services/paymentService';
import { jsPDF } from 'jspdf';
import toast from 'react-hot-toast';

const GuestFolio = () => {
    const [bookings, setBookings] = useState([]);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [bookingDetails, setBookingDetails] = useState(null);
    const [extraServices, setExtraServices] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);

    // Financial States
    const [allowDiscount, setAllowDiscount] = useState(false);
    const [discountPercent, setDiscountPercent] = useState(0);
    const [taxPercent, setTaxPercent] = useState(13); // Default GST 13%
    const [serviceChargePercent, setServiceChargePercent] = useState(10); // Default Service Charge 10%

    // Payment States
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [payments, setPayments] = useState([]);

    useEffect(() => {
        fetchBookings();
    }, []);

    useEffect(() => {
        if (selectedBooking) {
            fetchBookingDetails(selectedBooking);
        }
    }, [selectedBooking]);

    useEffect(() => {
        if (bookingDetails) {
            setDiscountPercent(bookingDetails.discountPercentage || 0);
            setAllowDiscount(bookingDetails.discountPercentage > 0);

            // Enforce fixed defaults even if DB has 0 or undefined
            // The user wants these fixed for all guests
            setTaxPercent(13);
            setServiceChargePercent(10);
        }
    }, [bookingDetails]);

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
            await fetchPayments(bookingId);
        } catch (error) {
            console.error('Error fetching booking details:', error);
            toast.error('Failed to load booking details');
        } finally {
            setLoading(false);
        }
    };

    const fetchPayments = async (bookingId) => {
        try {
            const response = await paymentService.getPaymentHistory(bookingId);
            setPayments(response?.payments || []);
        } catch (error) {
            console.error('Error fetching payments:', error);
        }
    };

    const handlePayment = async () => {
        if (!bookingDetails || paymentAmount <= 0) {
            toast.error('Please enter a valid payment amount');
            return;
        }

        try {
            await paymentService.createPayment({
                bookingId: bookingDetails.id,
                method: paymentMethod,
                amount: paymentAmount
            });

            // All payment methods work the same - no redirects
            toast.success('Payment recorded successfully');
            setShowPaymentModal(false);
            setPaymentAmount(0);
            await fetchPayments(bookingDetails.id);
            await fetchBookingDetails(bookingDetails.id);
        } catch (error) {
            console.error('Error recording payment:', error);
            toast.error(error?.message || 'Failed to record payment');
        }
    };

    const calculateTotalPaid = () => {
        return payments.reduce((total, payment) => {
            // Only count completed payments
            if (payment.status === 'completed') {
                return total + Number(payment.amount);
            }
            return total;
        }, 0);
    };

    const calculateRemainingBalance = () => {
        const grandTotal = calculateGrandTotal();
        const totalPaid = calculateTotalPaid();
        const remaining = grandTotal - totalPaid;
        // Return 0 if remaining is negative (overpaid)
        return remaining > 0 ? remaining : 0;
    };

    const updateBookingFinancials = async () => {
        if (!bookingDetails) return;
        try {
            await bookingService.updateBooking(bookingDetails.id, {
                discountPercentage: allowDiscount ? discountPercent : 0,
                taxPercentage: taxPercent,
                serviceChargePercentage: serviceChargePercent
            });
            toast.success('Booking financials updated');
        } catch (error) {
            console.error('Error updating financials:', error);
            toast.error('Failed to update financials');
        }
    };

    const getNights = () => {
        if (!bookingDetails) return 0;
        const checkIn = new Date(bookingDetails.checkIn);
        const checkOut = new Date(bookingDetails.checkOut);
        return Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    };

    const calculateRoomCharges = () => {
        if (!bookingDetails) return 0;
        const nights = getNights();
        const roomRate = bookingDetails.room?.roomTypeRef?.basePrice || bookingDetails.room?.price || 0;
        return nights * roomRate;
    };

    const calculateServicesTotal = () => {
        return extraServices.reduce((total, service) => {
            const itemBase = service.basePrice ? Number(service.basePrice) : (Number(service.unitPrice) * service.quantity);
            return total + itemBase;
        }, 0);
    };

    const calculateSubtotal = () => {
        return calculateRoomCharges() + calculateServicesTotal();
    };

    const calculateDiscountAmount = () => {
        if (!allowDiscount) return 0;
        const subtotal = calculateSubtotal();
        return (subtotal * discountPercent) / 100;
    };

    const calculateServiceChargeAmount = () => {
        const subtotal = calculateSubtotal();
        const discount = calculateDiscountAmount();
        return ((subtotal - discount) * serviceChargePercent) / 100;
    };

    const calculateTaxAmount = () => {
        const subtotal = calculateSubtotal();
        const discount = calculateDiscountAmount();
        const serviceCharge = calculateServiceChargeAmount();
        const taxableAmount = (subtotal - discount) + serviceCharge;
        return (taxableAmount * taxPercent) / 100;
    };

    const calculateGrandTotal = () => {
        const subtotal = calculateSubtotal();
        const discount = calculateDiscountAmount();
        const serviceCharge = calculateServiceChargeAmount();
        const tax = calculateTaxAmount();
        return (subtotal - discount) + serviceCharge + tax;
    };

    const filteredBookings = bookings.filter(booking => {
        const guestName = `${booking.guest?.firstName || ''} ${booking.guest?.lastName || ''}`.toLowerCase();
        const bookingId = `BK-${String(booking.id).padStart(4, '0')}`;
        const query = searchQuery.toLowerCase();
        return guestName.includes(query) || bookingId.includes(query) || booking.room?.roomNumber?.includes(query);
    });

    const handleDownloadPDF = () => {
        if (!bookingDetails) return;

        // Thermal Receipt Format (80mm width, 150mm height - reduced as requested)
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: [80, 150]
        });

        const pageWidth = 80;
        const margin = 5;
        const contentWidth = pageWidth - (margin * 2);
        let yPos = 10;

        // Helper for centered text
        const centerText = (text, y) => {
            doc.text(text, pageWidth / 2, y, { align: 'center' });
        };

        // Helper for left-right text
        const row = (label, value, y, isBold = false) => {
            doc.setFont('helvetica', isBold ? 'bold' : 'normal');
            doc.text(label, margin, y);
            doc.text(value, pageWidth - margin, y, { align: 'right' });
        };

        // --- Header ---
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0);
        centerText('INCHOTEL', yPos);
        yPos += 5;

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        centerText('Itahari, Nepal', yPos);
        yPos += 4;
        centerText('Tel: 025-586701/585701', yPos);
        yPos += 4;
        centerText('itaharinaumacollege@gamil.com', yPos);
        yPos += 6;

        doc.setLineWidth(0.2);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 5;

        // --- Invoice Info ---
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        centerText('GUEST FOLIO', yPos);
        yPos += 5;

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        row(`Inv #: ${bookingDetails.id}`, new Date().toLocaleDateString(), yPos);
        yPos += 5;

        // --- Guest Info ---
        doc.setFont('helvetica', 'bold');
        doc.text('Guest:', margin, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(`${bookingDetails.guest?.firstName} ${bookingDetails.guest?.lastName}`, margin + 12, yPos);
        yPos += 4;

        doc.setFont('helvetica', 'bold');
        doc.text('Room:', margin, yPos);
        doc.setFont('helvetica', 'normal');

        // Logic to determine room type name
        let roomTypeName = 'Standard';
        if (bookingDetails.room?.roomTypeRef?.name) {
            roomTypeName = bookingDetails.room.roomTypeRef.name;
        } else if (bookingDetails.room?.roomType) {
            // If roomType is just a number/ID (like "1"), don't show it as the name
            const isNumeric = /^\d+$/.test(String(bookingDetails.room.roomType));
            if (!isNumeric) {
                roomTypeName = bookingDetails.room.roomType;
            }
        }

        doc.text(`${bookingDetails.room?.roomNumber} (${roomTypeName})`, margin + 12, yPos);
        yPos += 4;

        row('Check-in:', new Date(bookingDetails.checkIn).toLocaleDateString(), yPos);
        yPos += 4;
        row('Check-out:', new Date(bookingDetails.checkOut).toLocaleDateString(), yPos);
        yPos += 6;

        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 5;

        // --- Items Header ---
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('Description', margin, yPos);
        doc.text('Amount', pageWidth - margin, yPos, { align: 'right' });
        yPos += 5;

        // --- Items Content ---
        doc.setFont('helvetica', 'normal');

        // Room Charges
        const nights = getNights();
        const roomRate = bookingDetails.room?.roomTypeRef?.basePrice || bookingDetails.room?.price || 0;
        const roomTotal = calculateRoomCharges();

        doc.text('Room Charges', margin, yPos);
        yPos += 4;
        row(`${nights} Nights x ${roomRate}`, roomTotal.toLocaleString(), yPos);
        yPos += 5;

        // Extra Services
        if (extraServices.length > 0) {
            extraServices.forEach(service => {
                const itemBase = service.basePrice ? Number(service.basePrice) : (Number(service.unitPrice) * service.quantity);

                // Truncate long names
                let name = service.extraService?.name || 'Service';
                if (name.length > 25) name = name.substring(0, 22) + '...';

                doc.text(name, margin, yPos);
                yPos += 4;
                row(`${service.quantity} x ${Number(service.unitPrice).toLocaleString()}`, itemBase.toLocaleString(), yPos);
                yPos += 5;
            });
        }

        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 5;

        // --- Totals ---
        const subtotal = calculateSubtotal();
        const grandTotal = calculateGrandTotal();

        row('Subtotal:', subtotal.toLocaleString(), yPos, true);
        yPos += 5;

        if (allowDiscount && discountPercent > 0) {
            row(`Discount: ${discountPercent}%`, '', yPos);
            yPos += 5;
        }

        // Always show fixed charges
        row(`Service Charge: ${serviceChargePercent}%`, '', yPos);
        yPos += 5;
        row(`GST: ${taxPercent}%`, '', yPos);
        yPos += 6;

        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 6;

        doc.setFontSize(10);
        row('GRAND TOTAL:', `NPR ${grandTotal.toLocaleString()}`, yPos, true);
        yPos += 10;

        // --- Footer ---
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        centerText('Thank you for your visit!', yPos);
        yPos += 4;
        centerText('Please come again.', yPos);

        doc.save(`Receipt_${bookingDetails.id}.pdf`);
    };


    return (
        <>
            <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 bg-white rounded-xl shadow-md p-6">
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

                    <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6">
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
                                       
                                        Room Charges
                                    </h3>
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-gray-700">
                                                {bookingDetails?.room?.roomTypeRef?.name || bookingDetails?.room?.roomType} × {getNights()} night(s)
                                            </span>
                                            <span className="font-semibold text-gray-900">
                                                NPR. {calculateRoomCharges().toLocaleString()}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500">
                                            @ NPR. {bookingDetails?.room?.roomTypeRef?.basePrice || bookingDetails?.room?.price || 0} per night
                                        </p>
                                    </div>
                                </div>

                                {extraServices.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                           
                                            Extra Services
                                        </h3>
                                        <div className="space-y-3">
                                            {extraServices.map((service) => (
                                                <div
                                                    key={service.id}
                                                    className="bg-gray-50 rounded-lg p-4"
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="flex-1">
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
                                                                <span className="text-xs text-gray-500">
                                                                    {new Date(service.createdAt || service.addedAt).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="mt-3 space-y-1 text-sm border-t pt-2">
                                                        <div className="flex justify-between text-gray-600">
                                                            <span>Base ({service.quantity} × Rs. {service.unitPrice})</span>
                                                            <span>NPR. {Number(service.basePrice || service.totalPrice).toLocaleString()}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-3 pt-3 border-t flex justify-between items-center">
                                            <span className="font-medium text-gray-700">Services Subtotal:</span>
                                            <span className="font-bold text-gray-900">
                                                NPR. {calculateServicesTotal().toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Financial Adjustments Section */}
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 no-print">
                                    <h3 className="font-semibold text-blue-800 mb-3">Billing Adjustments</h3>
                                    <div className="flex items-center gap-4 mb-4">
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
                                        <div className="mb-4">
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

                                    {/* Hidden inputs for Tax and Service Charge as they are fixed */}
                                    <div className="text-xs text-gray-500">
                                        <p>Service Charge: {serviceChargePercent}% (Fixed)</p>
                                        <p>GST: {taxPercent}% (Fixed)</p>
                                    </div>

                                    <div className="mt-3 text-right">
                                        <button
                                            onClick={updateBookingFinancials}
                                            className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                                        >
                                            Update Financials
                                        </button>
                                    </div>
                                </div>

                                <div className="border-t-2 border-gray-300 pt-4 space-y-2">
                                    <div className="flex justify-between items-center text-gray-600">
                                        <span>Subtotal</span>
                                        <span>NPR. {calculateSubtotal().toLocaleString()}</span>
                                    </div>

                                    {allowDiscount && discountPercent > 0 && (
                                        <div className="flex justify-between items-center text-green-600">
                                            <span>Discount ({discountPercent}%)</span>
                                            <span>- NPR. {calculateDiscountAmount().toLocaleString()}</span>
                                        </div>
                                    )}

                                    {serviceChargePercent > 0 && (
                                        <div className="flex justify-between items-center text-gray-600">
                                            <span>Service Charge ({serviceChargePercent}%)</span>
                                            <span>+ NPR. {calculateServiceChargeAmount().toLocaleString()}</span>
                                        </div>
                                    )}

                                    {taxPercent > 0 && (
                                        <div className="flex justify-between items-center text-gray-600">
                                            <span>GST ({taxPercent}%)</span>
                                            <span>+ NPR. {calculateTaxAmount().toLocaleString()}</span>
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center pt-2 border-t">
                                        <h3 className="text-2xl font-bold text-gray-900">Grand Total:</h3>
                                        <p className="text-3xl font-bold text-blue-600">
                                            NPR. {calculateGrandTotal().toLocaleString()}
                                        </p>
                                    </div>
                                </div>

                                {/* Payment Section */}
                                {calculateRemainingBalance() > 0 && (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                                        <div className="flex justify-between items-center mb-3">
                                            <div>
                                                <h4 className="font-semibold text-gray-900">Outstanding Balance</h4>
                                                <p className="text-2xl font-bold text-red-600">Rs. {calculateRemainingBalance().toLocaleString()}</p>
                                                {calculateTotalPaid() > 0 && (
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        Total Paid: NPR. {calculateTotalPaid().toLocaleString()}
                                                    </p>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setPaymentAmount(calculateRemainingBalance());
                                                    setShowPaymentModal(true);
                                                }}
                                                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 font-semibold"
                                            >
                                                <CreditCard size={20} />
                                                Pay Now
                                            </button>
                                        </div>
                                        {payments.length > 0 && (
                                            <div className="mt-3 pt-3 border-t border-yellow-300">
                                                <p className="text-sm font-medium text-gray-700 mb-2">Payment History:</p>
                                                <div className="space-y-1">
                                                    {payments.map((payment) => (
                                                        <div key={payment.id} className="flex justify-between text-sm">
                                                            <span className="text-gray-600">
                                                                {new Date(payment.createdAt).toLocaleDateString()} - {payment.method}
                                                                <span className={`ml-2 px-2 py-0.5 rounded text-xs ${payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                                    payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                                        'bg-red-100 text-red-800'
                                                                    }`}>
                                                                    {payment.status}
                                                                </span>
                                                            </span>
                                                            <span className="font-medium text-gray-900">Rs. {Number(payment.amount).toLocaleString()}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Fully Paid Message */}
                                {calculateRemainingBalance() === 0 && calculateTotalPaid() > 0 && (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-green-600 text-white rounded-full p-2">
                                                <CreditCard size={24} />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-green-900">Fully Paid</h4>
                                                <p className="text-sm text-green-700">Total Paid: NPR. {calculateTotalPaid().toLocaleString()}</p>
                                            </div>
                                        </div>
                                        {payments.length > 0 && (
                                            <div className="mt-3 pt-3 border-t border-green-300">
                                                <p className="text-sm font-medium text-gray-700 mb-2">Payment History:</p>
                                                <div className="space-y-1">
                                                    {payments.map((payment) => (
                                                        <div key={payment.id} className="flex justify-between text-sm">
                                                            <span className="text-gray-600">
                                                                {new Date(payment.createdAt).toLocaleDateString()} - {payment.method}
                                                                <span className={`ml-2 px-2 py-0.5 rounded text-xs ${payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                                    payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                                        'bg-red-100 text-red-800'
                                                                    }`}>
                                                                    {payment.status}
                                                                </span>
                                                            </span>
                                                            <span className="font-medium text-gray-900">Rs. {Number(payment.amount).toLocaleString()}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="flex gap-3 pt-4 no-print">
                                    <button
                                        onClick={handleDownloadPDF}
                                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <FileText size={18} />
                                        Download as PDF
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

            {/* Payment Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <CreditCard size={24} className="text-green-600" />
                                Record Payment
                            </h3>
                            <button
                                onClick={() => setShowPaymentModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Payment Amount
                                </label>
                                <input
                                    type="number"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                    placeholder="Enter amount"
                                />
                                <p className="text-sm text-gray-500 mt-1">
                                    Outstanding: NPR. {calculateRemainingBalance().toLocaleString()}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Payment Method
                                </label>
                                <select
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                >
                                    <option value="cash">Cash</option>
                                    <option value="card">Card</option>
                                    <option value="esewa">eSewa</option>
                                    <option value="khalti">Khalti</option>
                                    <option value="bank_transfer">Bank Transfer</option>
                                </select>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setShowPaymentModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handlePayment}
                                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                                >
                                    Record Payment
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default GuestFolio;
