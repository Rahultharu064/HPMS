import React, { useEffect, useState } from 'react'
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom'
import { Check, Calendar, Users, Mail, Phone, CreditCard, Home, ArrowRight, Download } from 'lucide-react'
import { bookingService } from '../../services/bookingService'
import { buildMediaUrl } from '../../utils/media'
import jsPDF from 'jspdf'

const BookingConfirmation = () => {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const status = params.get('status') || params.get('Status') || ''
    if (status.toLowerCase() === 'completed' || status.toLowerCase() === 'success') {
      navigate(`/booking/success/${id}`, { replace: true })
      return
    }
    let mounted = true
      ; (async () => {
        try {
          const res = await bookingService.getBookingById(id)
          if (mounted) setData(res.booking)
        } catch (e) {
          setError(e.message || 'Failed to load booking')
        } finally {
          setLoading(false)
        }
      })()
    return () => { mounted = false }
  }, [id, location.search, navigate])

  const getPrimaryImage = (room) => {
    const val = room?.image
    if (Array.isArray(val) && val.length > 0) return buildMediaUrl(val[0]?.url)
    return null
  }

  const downloadPDF = async () => {
  if (!data) return;

  try {
    const { default: jsPDF } = await import('jspdf');

    const width = 80; // receipt width in mm
    const margin = 5;
    const largeHeight = 2000; // temporary measurement height

    // ---------- SHARED HELPERS ----------
    const centerText = (doc, text, yRef, size = 10, bold = false) => {
      doc.setFontSize(size);
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      const wrapped = doc.splitTextToSize(String(text || ''), width - margin * 2);
      wrapped.forEach((line) => {
        doc.text(line, width / 2, yRef.value, { align: 'center' });
        yRef.value += size * 0.7;
      });
    };

    const addText = (doc, text, yRef, size = 9) => {
      doc.setFontSize(size);
      doc.setFont('helvetica', 'normal');
      const wrapped = doc.splitTextToSize(String(text || ''), width - margin * 2);
      wrapped.forEach((line) => {
        doc.text(line, margin, yRef.value);
        yRef.value += size * 0.6;
      });
    };

    const addLine = (doc, yRef) => {
      doc.setLineWidth(0.2);
      doc.line(margin, yRef.value, width - margin, yRef.value);
      yRef.value += 3;
    };

    // ---------- CONTENT RENDERER ----------
    const renderContent = (doc, yRef) => {
      // Header
      centerText(doc, "INCHOTEL ", yRef, 12, true);
      centerText(doc, "Booking Confirmation", yRef, 10);
      centerText(doc, "Itahari, Nepal", yRef, 8);
      centerText(doc, "TEL: 025-586701/585701", yRef, 8);

      yRef.value += 2;
      addLine(doc, yRef);

      // Booking details
      addText(doc, `Booking ID: BK-${String(data.id).padStart(4, '0')}`, yRef);
      addText(doc, `Status: ${data.status}`, yRef);
      addText(doc, `Guest: ${data.guest.firstName} ${data.guest.lastName}`, yRef);
      addText(doc, `Room: ${data.room.name}`, yRef);
      addText(doc, `Check-in: ${new Date(data.checkIn).toLocaleDateString()}`, yRef);
      addText(doc, `Check-out: ${new Date(data.checkOut).toLocaleDateString()}`, yRef);
      addText(doc, `Nights: ${nights}`, yRef);
      addText(
        doc,
        `Guests: ${data.adults} adult${data.adults !== 1 ? 's' : ''}${
          data.children
            ? `, ${data.children} child${data.children !== 1 ? 'ren' : ''}`
            : ''
        }`,
        yRef
      );

      yRef.value += 2;
      addLine(doc, yRef);

      // Payments
      if (data.payments?.length > 0) {
        addText(doc, "PAYMENT DETAILS", yRef, 10);
        yRef.value += 1;

        data.payments.forEach(payment => {
          doc.setFontSize(9);
          doc.text(`${payment.method} (${payment.status})`, margin, yRef.value);
          doc.text(
            `NPR ${payment.amount.toLocaleString()}`,
            width - margin,
            yRef.value,
            { align: "right" }
          );
          yRef.value += 4;
        });

        addLine(doc, yRef);
      }

      // TOTAL
      yRef.value += 1;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text("TOTAL AMOUNT:", margin, yRef.value);
      doc.text(
        `NPR ${data.totalAmount.toLocaleString()}`,
        width - margin,
        yRef.value,
        { align: "right" }
      );
      yRef.value += 6;

      // Footer
      addLine(doc, yRef);
      centerText(doc, "Thank you for choosing us!", yRef, 8);
      centerText(doc, new Date().toLocaleString(), yRef, 7);

      yRef.value += 5; // bottom spacing
    };

    // ---------- PHASE 1: MEASURE HEIGHT ----------
    const tempDoc = new jsPDF({ orientation: "portrait", unit: "mm", format: [width, largeHeight] });
    const measureY = { value: 10 };
    renderContent(tempDoc, measureY);

    const finalHeight = Math.max(110, Math.ceil(measureY.value + 10));

    // ---------- PHASE 2: CREATE FINAL PDF ----------
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: [width, finalHeight] });
    const yRef = { value: 10 };
    renderContent(pdf, yRef);

    pdf.save(`Booking-${String(data.id).padStart(4, '0')}.pdf`);
  } catch (error) {
    console.error("Error generating PDF:", error);
    alert("Failed to generate PDF. Please try again.");
  }
};


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading your booking...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-3xl">✕</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Oops!</h2>
          <p className="text-red-600 mb-6">{error}</p>
          <Link to="/rooms" className="inline-block px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
            Browse Rooms
          </Link>
        </div>
      </div>
    )
  }

  if (!data) return null

  const nights = Math.max(1, Math.ceil((new Date(data.checkOut) - new Date(data.checkIn)) / (1000 * 60 * 60 * 24)))

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Success Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full mb-4 shadow-lg animate-bounce-slow">
            <Check className="w-10 h-10 text-white" strokeWidth={3} />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-2">Booking Confirmed!</h1>
          <p className="text-gray-600 text-lg">Your reservation has been successfully processed</p>
        </div>

        {/* Main Content Card */}
        <div id="booking-confirmation-content" className="bg-white rounded-3xl shadow-2xl overflow-hidden mb-6 transform transition-all hover:shadow-3xl">
          {/* Room Header with Image */}
          <div className="relative h-64 md:h-80 overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300">
            {getPrimaryImage(data.room) && (
              <img
                src={getPrimaryImage(data.room)}
                alt={data.room.name}
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <h2 className="text-3xl md:text-4xl font-bold mb-2">{data.room.name}</h2>
              <div className="flex flex-wrap gap-3 text-sm">
                <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                  ID: {data.id}
                </span>
                <span className="bg-green-500 px-3 py-1 rounded-full font-semibold capitalize">
                  {data.status}
                </span>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Stay Details */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">Stay Details</h3>
                </div>
                <div className="space-y-2 text-gray-700">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Check-in:</span>
                    <span className="font-semibold">{new Date(data.checkIn).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Check-out:</span>
                    <span className="font-semibold">{new Date(data.checkOut).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-blue-200">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-semibold">{nights} {nights === 1 ? 'night' : 'nights'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Guests:</span>
                    <div className="flex items-center gap-2 font-semibold">
                      <Users className="w-4 h-4" />
                      {data.adults} adult{data.adults !== 1 ? 's' : ''}
                      {data.children ? `, ${data.children} ${data.children === 1 ? 'child' : 'children'}` : ''}
                    </div>
                  </div>
                </div>
              </div>

              {/* Guest Information */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">Guest Information</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-2xl font-bold text-gray-800">{data.guest.firstName} {data.guest.lastName}</p>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Mail className="w-4 h-4 text-purple-600" />
                    <span>{data.guest.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Phone className="w-4 h-4 text-purple-600" />
                    <span>{data.guest.phone}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-6 border border-green-200 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">Payment Details</h3>
              </div>
              {data.payments && data.payments.length > 0 ? (
                <div className="space-y-2 mb-4">
                  {data.payments.map(p => (
                    <div key={p.id} className="flex justify-between items-center bg-white/50 rounded-lg px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-mono text-gray-600">#{p.id}</span>
                        <span className="text-sm font-semibold text-gray-700 capitalize">{p.method}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${p.status === 'completed' ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'
                          }`}>
                          {p.status}
                        </span>
                      </div>
                      <span className="font-semibold text-gray-800">NPR {p.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 mb-4">No payments recorded.</p>
              )}
              <div className="flex justify-between items-center pt-4 border-t-2 border-green-300">
                <span className="text-xl font-bold text-gray-800">Total Amount</span>
                <span className="text-3xl font-bold text-green-600">₹{data.totalAmount.toLocaleString()}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <Link
                to="/rooms"
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all transform hover:scale-105 shadow-lg"
              >
                <Home className="w-5 h-5" />
                Browse More Rooms
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to={`/rooms/${data.roomId}`}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:border-gray-400 hover:bg-gray-50 transition-all"
              >
                View Room Details
              </Link>
              <Link
                to={`/profile`}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:border-gray-400 hover:bg-gray-50 transition-all"
              >
                Guest Profile
              </Link>
            </div>

            {/* Download PDF Button */}
            <div className="flex justify-center">
              <button
                onClick={downloadPDF}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-all transform hover:scale-105 shadow-lg"
              >
                <Download className="w-5 h-5" />
                Download Booking Proof (PDF)
              </button>
            </div>
          </div>
        </div>

        {/* Confirmation Message */}
        <div className="text-center text-gray-600">
          <p className="text-sm">A confirmation email has been sent to <span className="font-semibold">{data.guest.email}</span></p>
        </div>
      </div>
    </div>
  )
}

export default BookingConfirmation
