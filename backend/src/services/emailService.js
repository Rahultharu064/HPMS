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
      subject: 'Booking Confirmation - Stay Successful!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4CAF50;">Booking Completed Successfully!</h2>
          <p>Dear ${guestName},</p>
          <p>Thank you for choosing our hotel. Your booking has been successfully completed.</p>

          <h3>Booking Details:</h3>
          <ul>
            <li><strong>Booking ID:</strong> ${booking.id}</li>
            <li><strong>Room:</strong> ${roomName}</li>
            <li><strong>Check-in:</strong> ${checkIn}</li>
            <li><strong>Check-out:</strong> ${checkOut}</li>
            <li><strong>Total Amount:</strong> $${totalAmount}</li>
          </ul>

          <p>We hope you had a pleasant stay with us. Please don't hesitate to contact us for any future bookings or feedback.</p>

          <p>Best regards,<br>The Hotel Management Team</p>
        </div>
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
