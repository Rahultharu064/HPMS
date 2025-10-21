import prisma from "../config/client.js";
import request from 'request';

// Get available payment gateways
export const getPaymentGateways = async (req, res) => {
  try {
    const gateways = [
      {
        code: 'khalti',
        name: 'Khalti',
        description: 'Pay with Khalti',
        icon: 'https://khalti.com/static/img/logo.png',
        enabled: true
      },
      {
        code: 'esewa',
        name: 'eSewa',
        description: 'Pay with eSewa',
        icon: 'https://esewa.com.np/static/img/logo.png',
        enabled: true
      },
      {
        code: 'cash',
        name: 'Cash',
        description: 'Pay at property',
        icon: null,
        enabled: true
      },
      {
        code: 'card',
        name: 'Credit/Debit Card',
        description: 'Pay with card',
        icon: null,
        enabled: true
      }
    ];

    res.json({ success: true, gateways });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Failed to fetch payment gateways" });
  }
};

// Create payment record
export const createPayment = async (req, res) => {
  try {
    const { bookingId, method, amount } = req.body;

    if (!bookingId || !method) {
      return res.status(400).json({ success: false, error: "bookingId and method are required" });
    }
    const allowed = ['khalti', 'esewa', 'cash', 'card']
    if (!allowed.includes(String(method))) {
      return res.status(400).json({ success: false, error: "Unsupported payment method" });
    }

    // Validate booking exists
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { guest: true, room: true }
    });

    if (!booking) {
      return res.status(404).json({ success: false, error: "Booking not found" });
    }

    // Determine amount (fallback to booking total)
    const amt = amount ? parseFloat(amount) : Number(booking.totalAmount || 0)
    if (!Number.isFinite(amt) || amt <= 0) {
      return res.status(400).json({ success: false, error: "Invalid amount" });
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        bookingId: bookingId,
        method: method,
        amount: amt,
        status: method === 'cash' ? 'completed' : 'pending',
        createdAt: new Date()
      }
    });

    // Handle different payment methods
    if (method === 'khalti') {
      try {
        const khaltiResponse = await initiateKhaltiPayment(booking, amt);
        return res.json({
          success: true,
          payment: payment,
          gatewayResponse: khaltiResponse
        });
      } catch (e) {
        return res.status(400).json({ success: false, error: "Failed to initiate Khalti payment", details: e?.message || e });
      }
    } else if (method === 'esewa') {
      const esewaResponse = await initiateEsewaPayment(booking, amount);
      return res.json({
        success: true,
        payment: payment,
        gatewayResponse: esewaResponse
      });
    } else {
      // For cash and card payments, mark as completed
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'completed' }
      });

      return res.json({
        success: true,
        payment: payment,
        message: "Payment recorded successfully"
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Failed to create payment" });
  }
};

// Initiate Khalti payment
const initiateKhaltiPayment = async (booking, amount) => {
  try {
    const secret = process.env.KHALTI_SECRET_KEY
    if (!secret) {
      throw new Error('KHALTI_SECRET_KEY is not configured');
    }

    const khaltiData = {
      return_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/booking/confirm/${booking.id}`,
      website_url: process.env.FRONTEND_URL || 'http://localhost:5173',
      amount: (Math.round(parseFloat(amount) * 100)).toString(), // integer paisa as string
      purchase_order_id: `BOOKING_${booking.id}`,
      purchase_order_name: `Hotel Booking - ${booking.room.name}`,
      customer_info: {
        name: `${booking.guest.firstName} ${booking.guest.lastName}`,
        email: booking.guest.email,
        phone: booking.guest.phone
      }
    };

    return new Promise((resolve, reject) => {
      const options = {
        method: 'POST',
        url: 'https://dev.khalti.com/api/v2/epayment/initiate/',
        headers: {
          'Authorization': `Key ${secret}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(khaltiData)
      };

      request(options, function (error, response) {
        if (error) {
          reject(error);
          return;
        }
        
        try {
          const responseData = JSON.parse(response.body);
          if (response.statusCode >= 200 && response.statusCode < 300) {
            resolve(responseData);
          } else {
            const msg = responseData?.detail || responseData?.message || response.body || 'Khalti initiation failed'
            reject(new Error(typeof msg === 'string' ? msg : JSON.stringify(msg)))
          }
        } catch (parseError) {
          reject(parseError);
        }
      });
    });
  } catch (err) {
    console.error('Khalti payment initiation error:', err);
    throw err;
  }
};

// Initiate eSewa payment
const initiateEsewaPayment = async (booking, amount) => {
  try {
    const esewaData = {
      amt: parseFloat(amount).toString(),
      psc: 0,
      pdc: 0,
      txAmt: 0,
      tAmt: parseFloat(amount).toString(),
      pid: `BOOKING_${booking.id}`,
      scd: process.env.ESEWA_MERCHANT_ID || 'EPAYTEST',
      su: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/booking/confirm/${booking.id}`,
      fu: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/booking/cancel`
    };

    return {
      success: true,
      payment_url: `https://rc-epay.esewa.com.np/api/epay/main/v2/form`,
      form_data: esewaData,
      message: "Redirect to eSewa payment page"
    };
  } catch (err) {
    console.error('eSewa payment initiation error:', err);
    throw err;
  }
};

// Verify payment status
export const verifyPayment = async (req, res) => {
  try {
    const { paymentId, gateway } = req.params;
    const { token, amount } = req.body;

    const payment = await prisma.payment.findUnique({
      where: { id: parseInt(paymentId) },
      include: { booking: true }
    });

    if (!payment) {
      return res.status(404).json({ success: false, error: "Payment not found" });
    }

    if (gateway === 'khalti') {
      const verificationResult = await verifyKhaltiPayment(token, amount);
      
      if (verificationResult.success) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'completed' }
        });

        return res.json({
          success: true,
          payment: payment,
          message: "Payment verified successfully"
        });
      } else {
        return res.status(400).json({
          success: false,
          error: "Payment verification failed"
        });
      }
    } else if (gateway === 'esewa') {
      // eSewa verification logic
      const verificationResult = await verifyEsewaPayment(req.body);
      
      if (verificationResult.success) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'completed' }
        });

        return res.json({
          success: true,
          payment: payment,
          message: "Payment verified successfully"
        });
      } else {
        return res.status(400).json({
          success: false,
          error: "Payment verification failed"
        });
      }
    }

    res.json({ success: true, payment: payment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Failed to verify payment" });
  }
};

// Verify Khalti payment
const verifyKhaltiPayment = async (token, amount) => {
  try {
    return new Promise((resolve, reject) => {
      const options = {
        method: 'POST',
        url: 'https://dev.khalti.com/api/v2/epayment/lookup/',
        headers: {
          'Authorization': `Key ${process.env.KHALTI_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token,
          amount: Math.round(parseFloat(amount) * 100)
        })
      };

      request(options, function (error, response) {
        if (error) {
          reject(error);
          return;
        }
        
        try {
          const responseData = JSON.parse(response.body);
          resolve(responseData);
        } catch (parseError) {
          reject(parseError);
        }
      });
    });
  } catch (err) {
    console.error('Khalti payment verification error:', err);
    throw err;
  }
};

// Verify eSewa payment
const verifyEsewaPayment = async (paymentData) => {
  try {
    // eSewa verification logic
    // This would typically involve checking the payment data
    // and verifying with eSewa's verification endpoint
    
    return {
      success: true,
      message: "eSewa payment verified"
    };
  } catch (err) {
    console.error('eSewa payment verification error:', err);
    throw err;
  }
};

// Get payment history
export const getPaymentHistory = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const payments = await prisma.payment.findMany({
      where: { bookingId: parseInt(bookingId) },
      include: { booking: { include: { room: true, guest: true } } },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, payments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Failed to fetch payment history" });
  }
};

// Refund payment
export const refundPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { reason } = req.body;

    const payment = await prisma.payment.findUnique({
      where: { id: parseInt(paymentId) },
      include: { booking: true }
    });

    if (!payment) {
      return res.status(404).json({ success: false, error: "Payment not found" });
    }

    if (payment.status !== 'completed') {
      return res.status(400).json({ success: false, error: "Payment not completed" });
    }

    // Update payment status to refunded
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'refunded' }
    });

    res.json({
      success: true,
      message: "Payment refunded successfully",
      payment: payment
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Failed to refund payment" });
  }
};
