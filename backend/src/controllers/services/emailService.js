import nodemailer from 'nodemailer';

// Create transporter (configure with environment variables)
const createTransporter = () => {
  // Check if credentials are available
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('Email credentials not configured. Email sending will be skipped. Please set EMAIL_USER and EMAIL_PASS environment variables.');
    return null; // Return null to indicate email is not configured
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

export { createTransporter };

// Send booking success email
export const sendBookingSuccessEmail = async (booking) => {
  try {
    const transporter = createTransporter();

    // If transporter is null (credentials not configured), skip sending
    if (!transporter) {
      console.log('Email not configured, skipping booking success email for booking:', booking.id);
      return { success: true, message: 'Email not configured, skipped' };
    }

    const guestName = `${booking.guest.firstName} ${booking.guest.lastName}`;
    const roomName = booking.room.name;
    const checkIn = new Date(booking.checkIn).toLocaleDateString();
    const checkOut = new Date(booking.checkOut).toLocaleDateString();
    const totalAmount = booking.totalAmount;

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: booking.guest.email,
      subject: '🎉 Booking Confirmation - Welcome to Our Hotel!',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Booking Confirmation</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              background-color: #f8f9fa;
            }
            .container {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              margin: 20px;
              border-radius: 15px;
              overflow: hidden;
              box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            }
            .header {
              background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
              color: white;
              padding: 30px 20px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 700;
            }
            .content {
              background: white;
              padding: 40px 30px;
            }
            .welcome-message {
              font-size: 18px;
              color: #555;
              margin-bottom: 30px;
            }
            .booking-card {
              background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
              border-radius: 12px;
              padding: 25px;
              margin: 25px 0;
              color: white;
              box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            }
            .booking-card h3 {
              margin-top: 0;
              font-size: 22px;
              text-align: center;
              margin-bottom: 20px;
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 12px;
              padding: 8px 0;
              border-bottom: 1px solid rgba(255,255,255,0.2);
            }
            .detail-row:last-child {
              border-bottom: none;
              font-size: 20px;
              font-weight: bold;
              margin-top: 15px;
            }
            .detail-label {
              font-weight: 600;
            }
            .detail-value {
              text-align: right;
            }
            .highlight {
              background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
              color: #333;
              padding: 15px;
              border-radius: 8px;
              margin: 20px 0;
              text-align: center;
              font-weight: 600;
            }
            .footer {
              background: #f8f9fa;
              padding: 30px;
              text-align: center;
              border-top: 2px solid #e9ecef;
            }
            .footer p {
              margin: 10px 0;
              color: #666;
            }
            .contact-info {
              background: white;
              padding: 20px;
              border-radius: 8px;
              margin-top: 20px;
              border-left: 4px solid #4facfe;
            }
            .emoji {
              font-size: 24px;
            }
            .booking-id {
              background: rgba(255,255,255,0.2);
              padding: 8px 15px;
              border-radius: 20px;
              font-family: monospace;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Booking Confirmed!</h1>
              <p>Your stay awaits you</p>
            </div>

            <div class="content">
              <div class="welcome-message">
                <p>Dear <strong>${guestName}</strong>,</p>
                <p>Welcome to our luxurious hotel! 🌟 We're thrilled to have you as our guest and can't wait to provide you with an unforgettable experience.</p>
              </div>

              <div class="booking-card">
                <h3>🏨 Your Booking Details</h3>
                <div class="detail-row">
                  <span class="detail-label">Booking ID:</span>
                  <span class="detail-value booking-id">#${booking.id}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">🏠 Room:</span>
                  <span class="detail-value">${roomName}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">📅 Check-in:</span>
                  <span class="detail-value">${checkIn}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">📅 Check-out:</span>
                  <span class="detail-value">${checkOut}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">💰 Total Amount:</span>
                  <span class="detail-value">₹${totalAmount}</span>
                </div>
              </div>

              <div class="highlight">
                ✨ Your booking is now confirmed and we're preparing everything for your arrival!
              </div>

              <div class="contact-info">
                <h4>📞 Need Assistance?</h4>
                <p>Our team is here to help make your stay perfect. Feel free to reach out to us anytime.</p>
                <p><strong>Phone:</strong> +977-123-456789<br>
                <strong>Email:</strong> reservations@ourhotel.com</p>
              </div>
            </div>

            <div class="footer">
              <p>Thank you for choosing us! We look forward to welcoming you soon.</p>
              <p>Best regards,<br><strong>The Hotel Management Team</strong></p>
              <p>🏨 Experience luxury, create memories 🏨</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Booking success email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Failed to send booking success email:', error);
    return { success: false, error: error.message };
  }
};

// Send payment receipt email with full billing details
export const sendPaymentReceiptEmail = async (bookingId) => {
  try {
    const transporter = createTransporter();

    // If transporter is null (credentials not configured), skip sending
    if (!transporter) {
      console.log('Email not configured, skipping payment receipt email for booking:', bookingId);
      return { success: true, message: 'Email not configured, skipped' };
    }

    // Import prisma here to avoid circular dependencies
    const { default: prisma } = await import('../../config/client.js');

    // Fetch complete booking details with all relations
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        guest: true,
        room: {
          include: {
            roomTypeRef: true
          }
        },
        extraServices: {
          include: {
            extraService: {
              include: {
                category: true
              }
            }
          }
        },
        payments: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    const guestName = `${booking.guest.firstName} ${booking.guest.lastName}`;
    const roomNumber = booking.room.roomNumber;
    const roomType = booking.room.roomTypeRef?.name || 'Standard';
    const checkIn = new Date(booking.checkIn).toLocaleDateString();
    const checkOut = new Date(booking.checkOut).toLocaleDateString();

    // Calculate nights
    const nights = Math.ceil((new Date(booking.checkOut) - new Date(booking.checkIn)) / (1000 * 60 * 60 * 24));
    const roomRate = booking.room.roomTypeRef?.basePrice || booking.room.price || 0;
    const roomCharges = nights * roomRate;

    // Calculate extra services total
    const extraServicesTotal = booking.extraServices.reduce((sum, es) => {
      return sum + Number(es.totalPrice || es.basePrice || 0);
    }, 0);

    // Calculate subtotal
    const subtotal = roomCharges + extraServicesTotal;

    // Get financial breakdown
    const discountPercent = booking.discountPercentage || 0;
    const serviceChargePercent = booking.serviceChargePercentage || 10;
    const taxPercent = booking.taxPercentage || 13;

    const discountAmount = (subtotal * discountPercent) / 100;
    const afterDiscount = subtotal - discountAmount;
    const serviceCharge = (afterDiscount * serviceChargePercent) / 100;
    const taxableAmount = afterDiscount + serviceCharge;
    const taxAmount = (taxableAmount * taxPercent) / 100;
    const grandTotal = taxableAmount + taxAmount;

    // Calculate total paid
    const totalPaid = booking.payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const balance = grandTotal - totalPaid;

    // Generate extra services HTML
    const extraServicesHTML = booking.extraServices.length > 0 ? `
      <div style="margin: 25px 0;">
        <h3 style="color: #333; font-size: 18px; margin-bottom: 15px; border-bottom: 2px solid #4facfe; padding-bottom: 8px;">
          🛎️ Extra Services
        </h3>
        ${booking.extraServices.map(service => `
          <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; margin-bottom: 10px;">
            <div style="display: flex; justify-content: space-between; align-items: start;">
              <div>
                <strong style="color: #333;">${service.extraService?.name || 'Service'}</strong>
                <div style="font-size: 13px; color: #666; margin-top: 4px;">
                  ${service.quantity} × ₹${Number(service.unitPrice).toLocaleString()}
                </div>
                ${service.extraService?.category?.name ? `
                  <span style="display: inline-block; background: #e9ecef; padding: 2px 8px; border-radius: 12px; font-size: 11px; color: #666; margin-top: 4px;">
                    ${service.extraService.category.name}
                  </span>
                ` : ''}
              </div>
              <strong style="color: #333;">₹${Number(service.totalPrice || service.basePrice).toLocaleString()}</strong>
            </div>
          </div>
        `).join('')}
      </div>
    ` : '';

    // Generate payment history HTML
    const paymentHistoryHTML = booking.payments.length > 0 ? `
      <div style="margin: 25px 0;">
        <h3 style="color: #333; font-size: 18px; margin-bottom: 15px; border-bottom: 2px solid #4facfe; padding-bottom: 8px;">
          💳 Payment History
        </h3>
        ${booking.payments.map(payment => {
      const statusColor = payment.status === 'completed' ? '#10b981' : payment.status === 'pending' ? '#f59e0b' : '#ef4444';
      return `
            <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e9ecef;">
              <div>
                <span style="color: #666; font-size: 14px;">
                  ${new Date(payment.createdAt).toLocaleDateString()} - ${payment.method.toUpperCase()}
                </span>
                <span style="display: inline-block; margin-left: 10px; padding: 2px 8px; border-radius: 12px; font-size: 11px; background: ${statusColor}20; color: ${statusColor};">
                  ${payment.status}
                </span>
              </div>
              <strong style="color: #333;">₹${Number(payment.amount).toLocaleString()}</strong>
            </div>
          `;
    }).join('')}
      </div>
    ` : '';

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: booking.guest.email,
      subject: `🧾 Payment Receipt - Booking #${booking.id}`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Payment Receipt</title>
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 650px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
          <div style="background: white; border-radius: 15px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 30px 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700;">🧾 Payment Receipt</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Thank you for your payment!</p>
            </div>

            <!-- Content -->
            <div style="padding: 40px 30px;">
              
              <!-- Guest Info -->
              <div style="margin-bottom: 30px;">
                <p style="font-size: 16px; color: #555;">Dear <strong>${guestName}</strong>,</p>
                <p style="color: #666;">Thank you for your payment. Here's your detailed receipt for your stay with us.</p>
              </div>

              <!-- Booking Details Card -->
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 25px; color: white; margin: 25px 0;">
                <h3 style="margin: 0 0 20px 0; font-size: 20px; text-align: center;">📋 Booking Information</h3>
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.2);">
                  <span>Booking ID:</span>
                  <strong>#${booking.id}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.2);">
                  <span>Room:</span>
                  <strong>${roomNumber} (${roomType})</strong>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.2);">
                  <span>Check-in:</span>
                  <strong>${checkIn}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                  <span>Check-out:</span>
                  <strong>${checkOut}</strong>
                </div>
              </div>

              <!-- Charges Breakdown -->
              <div style="margin: 30px 0;">
                <h3 style="color: #333; font-size: 18px; margin-bottom: 15px; border-bottom: 2px solid #4facfe; padding-bottom: 8px;">
                  💰 Charges Breakdown
                </h3>
                
                <!-- Room Charges -->
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <strong style="color: #333;">Room Charges</strong>
                    <strong style="color: #333;">₹${roomCharges.toLocaleString()}</strong>
                  </div>
                  <div style="font-size: 13px; color: #666;">
                    ${nights} night(s) × ₹${roomRate.toLocaleString()} per night
                  </div>
                </div>

                ${extraServicesHTML}

                <!-- Financial Summary -->
                <div style="border-top: 2px solid #e9ecef; padding-top: 15px; margin-top: 20px;">
                  <div style="display: flex; justify-content: space-between; padding: 8px 0; color: #666;">
                    <span>Subtotal:</span>
                    <span>₹${subtotal.toLocaleString()}</span>
                  </div>
                  ${discountPercent > 0 ? `
                    <div style="display: flex; justify-content: space-between; padding: 8px 0; color: #10b981;">
                      <span>Discount (${discountPercent}%):</span>
                      <span>- ₹${discountAmount.toLocaleString()}</span>
                    </div>
                  ` : ''}
                  <div style="display: flex; justify-content: space-between; padding: 8px 0; color: #666;">
                    <span>Service Charge (${serviceChargePercent}%):</span>
                    <span>+ ₹${serviceCharge.toLocaleString()}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; padding: 8px 0; color: #666;">
                    <span>GST (${taxPercent}%):</span>
                    <span>+ ₹${taxAmount.toLocaleString()}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; padding: 15px 0; border-top: 2px solid #333; margin-top: 10px;">
                    <strong style="font-size: 20px; color: #333;">Grand Total:</strong>
                    <strong style="font-size: 24px; color: #4facfe;">₹${grandTotal.toLocaleString()}</strong>
                  </div>
                </div>
              </div>

              ${paymentHistoryHTML}

              <!-- Payment Status -->
              <div style="background: ${balance <= 0 ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'}; border-radius: 12px; padding: 20px; color: white; text-align: center; margin: 25px 0;">
                <h3 style="margin: 0 0 10px 0; font-size: 20px;">
                  ${balance <= 0 ? '✅ Fully Paid' : '⚠️ Partial Payment'}
                </h3>
                <div style="font-size: 16px; margin: 10px 0;">
                  <div>Total Paid: <strong>₹${totalPaid.toLocaleString()}</strong></div>
                  ${balance > 0 ? `<div style="margin-top: 8px;">Outstanding Balance: <strong>₹${balance.toLocaleString()}</strong></div>` : ''}
                </div>
              </div>

              <!-- Contact Info -->
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #4facfe; margin-top: 30px;">
                <h4 style="margin: 0 0 10px 0; color: #333;">📞 Need Assistance?</h4>
                <p style="margin: 5px 0; color: #666;">
                  <strong>Phone:</strong> 025-586701 / 585701<br>
                  <strong>Email:</strong> itaharinaumacollege@gmail.com<br>
                  <strong>Address:</strong> Itahari, Nepal
                </p>
              </div>
            </div>

            <!-- Footer -->
            <div style="background: #f8f9fa; padding: 30px; text-align: center; border-top: 2px solid #e9ecef;">
              <p style="margin: 10px 0; color: #666;">Thank you for choosing INCHOTEL!</p>
              <p style="margin: 10px 0; color: #666;">
                <strong>Best regards,</strong><br>
                The INCHOTEL Management Team
              </p>
              <p style="margin: 15px 0 0 0; color: #999; font-size: 12px;">
                This is an automated receipt. Please keep it for your records.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Payment receipt email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Failed to send payment receipt email:', error);
    return { success: false, error: error.message };
  }
};
