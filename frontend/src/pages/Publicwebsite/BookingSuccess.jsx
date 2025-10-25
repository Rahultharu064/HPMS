import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { CheckCircle, Calendar, Users, Mail, Phone, CreditCard, Home, ArrowRight, Download, Sparkles, Star, MapPin } from 'lucide-react'
import { bookingService } from '../../services/bookingService'
import { buildMediaUrl } from '../../utils/media'
import jsPDF from 'jspdf'

const BookingSuccess = () => {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [emailSent, setEmailSent] = useState(false)
  const [showConfetti, setShowConfetti] = useState(true)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await bookingService.getBookingById(id)
        if (mounted) {
          setData(res.booking)
          // Check if booking is confirmed and email should be sent
          if (res.booking.status === 'confirmed') {
            setEmailSent(true)
          }
        }
      } catch (e) {
        setError(e.message || 'Failed to load booking')
      } finally {
        setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [id])

  // Hide confetti after animation
  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 3000)
    return () => clearTimeout(timer)
  }, [])

  const getPrimaryImage = (room) => {
    const val = room?.image
    if (Array.isArray(val) && val.length > 0) return buildMediaUrl(val[0]?.url)
    return null
  }

  const downloadPDF = async () => {
    if (!data) return

    try {
      // Show loading state
      const button = document.querySelector('button[onclick*="downloadPDF"]')
      if (button) {
        button.disabled = true
        button.textContent = 'Generating PDF...'
      }

      // Create PDF with booking details
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      let yPosition = 20

      // Add title
      pdf.setFontSize(20)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Booking Confirmation', pageWidth / 2, yPosition, { align: 'center' })
      yPosition += 15

      // Add booking details
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'normal')

      const details = [
        `Booking ID: ${data.id}`,
        `Status: ${data.status}`,
        `Room: ${data.room.name}`,
        `Check-in: ${new Date(data.checkIn).toLocaleDateString()}`,
        `Check-out: ${new Date(data.checkOut).toLocaleDateString()}`,
        `Guests: ${data.adults} adult${data.adults !== 1 ? 's' : ''}${data.children ? `, ${data.children} child${data.children !== 1 ? 'ren' : ''}` : ''}`,
        `Guest: ${data.guest.firstName} ${data.guest.lastName}`,
        `Email: ${data.guest.email}`,
        `Phone: ${data.guest.phone}`,
        `Total Amount: ₹${data.totalAmount.toLocaleString()}`
      ]

      details.forEach(detail => {
        if (yPosition > pageHeight - 20) {
          pdf.addPage()
          yPosition = 20
        }
        pdf.text(detail, 20, yPosition)
        yPosition += 8
      })

      // Add payment details if available
      if (data.payments && data.payments.length > 0) {
        yPosition += 5
        if (yPosition > pageHeight - 20) {
          pdf.addPage()
          yPosition = 20
        }
        pdf.setFont('helvetica', 'bold')
        pdf.text('Payment Details:', 20, yPosition)
        yPosition += 8
        pdf.setFont('helvetica', 'normal')

        data.payments.forEach(payment => {
          if (yPosition > pageHeight - 20) {
            pdf.addPage()
            yPosition = 20
          }
          pdf.text(`Payment #${payment.id}: ${payment.method} - ${payment.status} - ₹${payment.amount}`, 30, yPosition)
          yPosition += 8
        })
      }

      // Add footer
      yPosition += 10
      if (yPosition > pageHeight - 20) {
        pdf.addPage()
        yPosition = 20
      }
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'italic')
      pdf.text('Thank you for choosing our hotel. This is your official booking confirmation.', 20, yPosition)
      yPosition += 8
      pdf.text(`Generated on: ${new Date().toLocaleString()}`, 20, yPosition)

      pdf.save(`booking-${data.id}-confirmation.pdf`)

      // Reset button
      if (button) {
        button.disabled = false
        button.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg> Download Booking Proof (PDF)'
      }
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Failed to generate PDF. Please try again.')

      // Reset button on error
      const button = document.querySelector('button[onclick*="downloadPDF"]')
      if (button) {
        button.disabled = false
        button.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg> Download Booking Proof (PDF)'
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading your booking...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md text-center">
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

  const nights = Math.max(1, Math.ceil((new Date(data.checkOut) - new Date(data.checkIn)) / (1000*60*60*24)))

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 py-12 px-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-green-200 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-emerald-300 rounded-full opacity-30 animate-bounce"></div>
        <div className="absolute bottom-20 left-1/4 w-20 h-20 bg-teal-200 rounded-full opacity-25 animate-pulse"></div>
        <div className="absolute bottom-40 right-10 w-16 h-16 bg-green-300 rounded-full opacity-20 animate-bounce"></div>
      </div>

      {/* Confetti Animation */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: ['#10B981', '#059669', '#047857', '#065F46', '#34D399'][Math.floor(Math.random() * 5)]
                }}
              ></div>
            </div>
          ))}
        </div>
      )}

      <div className="container mx-auto max-w-5xl relative z-10">
        {/* Success Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full mb-6 shadow-2xl animate-bounce-slow relative">
            <CheckCircle className="w-12 h-12 text-white" strokeWidth={3} />
            <div className="absolute -top-2 -right-2">
              <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-800 mb-4 animate-slide-up">
            Booking Confirmed!
          </h1>
          <p className="text-gray-600 text-xl animate-slide-up-delayed">
            Your reservation has been successfully processed
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <Star className="w-5 h-5 text-yellow-500 fill-current" />
            <Star className="w-5 h-5 text-yellow-500 fill-current" />
            <Star className="w-5 h-5 text-yellow-500 fill-current" />
            <Star className="w-5 h-5 text-yellow-500 fill-current" />
            <Star className="w-5 h-5 text-yellow-500 fill-current" />
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden mb-8 transform transition-all hover:shadow-3xl animate-slide-up-delayed">
          {/* Room Header with Image */}
          <div className="relative h-80 md:h-96 overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300">
            {getPrimaryImage(data.room) && (
              <img
                src={getPrimaryImage(data.room)}
                alt={data.room.name}
                className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
            <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-5 h-5" />
                <span className="text-sm font-medium">Your Perfect Stay</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-3">{data.room.name}</h2>
              <div className="flex flex-wrap gap-4 text-sm">
                <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full font-medium">
                  ID: {data.id}
                </span>
                <span className="bg-green-500 px-4 py-2 rounded-full font-semibold capitalize shadow-lg">
                  ✓ {data.status}
                </span>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="p-8 md:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Stay Details */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-3xl p-8 border border-green-200 shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800">Stay Details</h3>
                </div>
                <div className="space-y-4 text-gray-700">
                  <div className="flex justify-between items-center py-2 border-b border-green-200">
                    <span className="font-medium">Check-in:</span>
                    <span className="font-bold text-lg">{new Date(data.checkIn).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-green-200">
                    <span className="font-medium">Check-out:</span>
                    <span className="font-bold text-lg">{new Date(data.checkOut).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-green-200">
                    <span className="font-medium">Duration:</span>
                    <span className="font-bold text-lg text-green-600">{nights} {nights === 1 ? 'night' : 'nights'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="font-medium">Guests:</span>
                    <div className="flex items-center gap-2 font-bold text-lg">
                      <Users className="w-5 h-5 text-green-600" />
                      {data.adults} adult{data.adults !== 1 ? 's' : ''}
                      {data.children ? `, ${data.children} ${data.children === 1 ? 'child' : 'children'}` : ''}
                    </div>
                  </div>
                </div>
              </div>

              {/* Guest Information */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl p-8 border border-blue-200 shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800">Guest Information</h3>
                </div>
                <div className="space-y-4">
                  <div className="bg-white/50 rounded-xl p-4">
                    <p className="text-3xl font-bold text-gray-800 mb-1">{data.guest.firstName} {data.guest.lastName}</p>
                    <p className="text-sm text-gray-600">Welcome to our hotel!</p>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700 bg-white/50 rounded-xl p-4">
                    <Mail className="w-5 h-5 text-blue-600" />
                    <span className="font-medium">{data.guest.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700 bg-white/50 rounded-xl p-4">
                    <Phone className="w-5 h-5 text-blue-600" />
                    <span className="font-medium">{data.guest.phone}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-100 rounded-3xl p-8 border border-emerald-200 shadow-lg mb-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800">Payment Details</h3>
              </div>
              {data.payments && data.payments.length > 0 ? (
                <div className="space-y-4 mb-6">
                  {data.payments.map(p => (
                    <div key={p.id} className="flex justify-between items-center bg-white/60 rounded-2xl px-6 py-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-mono text-gray-600 bg-gray-100 px-3 py-1 rounded-full">#{p.id}</span>
                        <span className="text-lg font-semibold text-gray-700 capitalize">{p.method}</span>
                        <span className={`text-sm px-4 py-2 rounded-full font-medium ${
                          p.status === 'completed' ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'
                        }`}>
                          {p.status}
                        </span>
                      </div>
                      <span className="font-bold text-2xl text-gray-800">₹{p.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 bg-white/50 rounded-xl p-4">No payments recorded.</p>
              )}
              <div className="flex justify-between items-center pt-6 border-t-2 border-emerald-300 bg-white/50 rounded-2xl p-6">
                <span className="text-2xl font-bold text-gray-800">Total Amount</span>
                <span className="text-4xl font-bold text-emerald-600">₹{data.totalAmount.toLocaleString()}</span>
              </div>
            </div>

            {/* Success Message */}
            <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 border-2 border-green-200 rounded-3xl p-8 mb-8 shadow-lg">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mb-4 shadow-lg">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-green-800 mb-4">Thank You for Choosing Us!</h3>
                <p className="text-green-700 text-lg leading-relaxed">
                  Your booking has been confirmed and a confirmation email has been sent to your email address.
                  We're excited to welcome you to our hotel and ensure you have an unforgettable stay.
                </p>
                <div className="mt-6 flex items-center justify-center gap-2 text-green-600">
                  <Sparkles className="w-5 h-5" />
                  <span className="font-medium">Your adventure awaits!</span>
                  <Sparkles className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <Link
                to="/rooms"
                className="flex-1 flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl font-bold hover:from-blue-700 hover:to-blue-800 transition-all transform hover:scale-105 shadow-xl hover:shadow-2xl"
              >
                <Home className="w-6 h-6" />
                Explore More Rooms
                <ArrowRight className="w-6 h-6" />
              </Link>
              <Link
                to={`/rooms/${data.roomId}`}
                className="flex-1 flex items-center justify-center gap-3 px-8 py-4 bg-white border-2 border-gray-300 text-gray-700 rounded-2xl font-bold hover:border-gray-400 hover:bg-gray-50 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                View Room Details
              </Link>
              <Link
                to="/guest/profile"
                className="flex-1 flex items-center justify-center gap-3 px-8 py-4 bg-white border-2 border-gray-300 text-gray-700 rounded-2xl font-bold hover:border-gray-400 hover:bg-gray-50 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Guest Profile
              </Link>
            </div>

            {/* Download PDF Button */}
            <div className="flex justify-center">
              <button
                onClick={downloadPDF}
                className="flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl font-bold hover:from-emerald-700 hover:to-teal-700 transition-all transform hover:scale-105 shadow-xl hover:shadow-2xl"
              >
                <Download className="w-6 h-6" />
                Download Booking Proof (PDF)
              </button>
            </div>
          </div>
        </div>

        {/* Footer Message */}
        <div className="text-center text-gray-600">
          <p className="text-lg">A confirmation email has been sent to <span className="font-bold text-gray-800">{data.guest.email}</span></p>
          <p className="text-sm mt-2">Need help? Contact us anytime at support@hotel.com</p>
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes confetti {
          0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        .animate-confetti {
          animation: confetti 3s ease-in-out infinite;
        }
        .animate-fade-in {
          animation: fadeIn 1s ease-out;
        }
        .animate-slide-up {
          animation: slideUp 1s ease-out;
        }
        .animate-slide-up-delayed {
          animation: slideUp 1s ease-out 0.3s both;
        }
        .animate-bounce-slow {
          animation: bounce 2s infinite;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

export default BookingSuccess
