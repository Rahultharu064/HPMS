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
