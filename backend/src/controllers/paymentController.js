import prisma from "../config/client.js";
import request from 'request';
import crypto from 'crypto';
import { sendBookingSuccessEmail } from "../services/emailService.js";

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

// Cleanup duplicate payments:
// - Operates per booking and method
// - If any 'completed' exists: keep the latest completed, delete all other payments (pending/completed) for same booking+method
// - Else (no completed): keep latest pending, delete older pendings
export const cleanupDuplicatePayments = async (req, res) => {
  try {
    const { bookingId } = req.body || {}

    const processGroups = async (bookingIds) => {
      let deleted = 0
      for (const bId of bookingIds) {
        const payments = await prisma.payment.findMany({
          where: { bookingId: Number(bId) },
          orderBy: { createdAt: 'desc' }
        })
        if (!payments || payments.length <= 1) continue
        // group by method
        const byMethod = new Map()
        for (const p of payments) {
          const key = String(p.method || 'unknown').toLowerCase()
          if (!byMethod.has(key)) byMethod.set(key, [])
          byMethod.get(key).push(p)
        }
        for (const [method, list] of byMethod.entries()) {
          if (list.length <= 1) continue
          const completed = list.filter(p => String(p.status) === 'completed')
          if (completed.length > 0) {
            // keep the most recent completed, delete the rest in this group
            const keepId = completed[0].id // list ordered desc
            const toDelete = list.filter(p => p.id !== keepId).map(p => p.id)
            if (toDelete.length) {
              const resDel = await prisma.payment.deleteMany({ where: { id: { in: toDelete } } })
              deleted += resDel.count
            }
          } else {
            // no completed: keep most recent pending, delete older pending
            const keepId = list[0].id
            const toDelete = list.slice(1).map(p => p.id)
            if (toDelete.length) {
              const resDel = await prisma.payment.deleteMany({ where: { id: { in: toDelete } } })
              deleted += resDel.count
            }
          }
        }
      }
      return deleted
    }

    let deleted = 0
    if (bookingId) {
      deleted = await processGroups([Number(bookingId)])
    } else {
      // Global cleanup: find bookings that have more than 1 payment
      const many = await prisma.payment.groupBy({ by: ['bookingId'], _count: { _all: true } })
      const targets = many.filter(g => (g._count?._all || 0) > 1).map(g => g.bookingId)
      if (targets.length > 0) {
        deleted = await processGroups(targets)
      }
    }

    return res.json({ success: true, deleted })
  } catch (err) {
    console.error('cleanupDuplicatePayments error:', err)
    return res.status(500).json({ success: false, error: 'Failed to cleanup duplicate payments' })
  }
}

// Mark a payment as completed (manual override)
export const markPaymentCompleted = async (req, res) => {
  try {
    const { paymentId } = req.params
    const id = parseInt(paymentId)
    if (!id) return res.status(400).json({ success: false, error: 'Invalid paymentId' })

    const payment = await prisma.payment.findUnique({ where: { id }, include: { booking: true } })
    if (!payment) return res.status(404).json({ success: false, error: 'Payment not found' })

    await prisma.payment.update({ where: { id }, data: { status: 'completed' } })
    if (payment.bookingId) {
      await prisma.booking.update({ where: { id: payment.bookingId }, data: { status: 'confirmed', updatedAt: new Date() } }).catch(()=>{})
    }

    return res.json({ success: true })
  } catch (err) {
    console.error('markPaymentCompleted error:', err)
    return res.status(500).json({ success: false, error: 'Failed to update payment' })
  }
}

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
      include: {
        guest: true,
        room: true,
        extraServices: {
          include: {
            extraService: true
          }
        }
      }
    });

    if (!booking) {
      return res.status(404).json({ success: false, error: "Booking not found" });
    }

    // Calculate total amount including extra services
    let totalAmount = Number(booking.totalAmount || 0);
    const extraServicesTotal = booking.extraServices.reduce((sum, es) => sum + Number(es.totalPrice), 0);
    totalAmount += extraServicesTotal;

    // Determine amount (fallback to calculated total)
    const amt = amount ? parseFloat(amount) : totalAmount;
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
        const khaltiResponse = await initiateKhaltiPayment({ req, booking, amount: amt });
        return res.json({
          success: true,
          payment: payment,
          gatewayResponse: khaltiResponse
        });
      } catch (e) {
        return res.status(400).json({ success: false, error: "Failed to initiate Khalti payment", details: e?.message || e });
      }
    } else if (method === 'esewa') {
      const esewaResponse = await initiateEsewaPayment({ req, booking, amount: amt, payment });
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
const initiateKhaltiPayment = async ({ req, booking, amount }) => {
  try {
    const secret = process.env.KHALTI_SECRET_KEY
    if (!secret) {
      throw new Error('KHALTI_SECRET_KEY is not configured');
    }

    const backendBase = process.env.BACKEND_URL || (req && req.get ? `${req.protocol}://${req.get('host')}` : 'http://localhost:5000')
    const khaltiData = {
      return_url: `${backendBase}/api/payments/khalti/return?purchase_order_id=BOOKING_${booking.id}`,
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
      const khaltiEnv = String(process.env.KHALTI_ENV || '').toLowerCase()
      const khaltiInitUrl = khaltiEnv === 'prod'
        ? 'https://khalti.com/api/v2/epayment/initiate/'
        : 'https://dev.khalti.com/api/v2/epayment/initiate/'
      const options = {
        method: 'POST',
        url: khaltiInitUrl,
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
            const msg = responseData?.detail || responseData?.message || responseData?.error || response.body || 'Khalti initiation failed'
            const meta = { status: response.statusCode, url: khaltiInitUrl }
            reject(new Error(typeof msg === 'string' ? `${msg} (${JSON.stringify(meta)})` : JSON.stringify({ msg, ...meta })))
          }
        } catch (parseError) {
          const meta = { status: response?.statusCode, url: options.url, raw: response?.body?.slice?.(0, 500) }
          reject(new Error(`Khalti initiate parse error: ${parseError?.message || parseError}. ${JSON.stringify(meta)}`));
        }
      });
    });
  } catch (err) {
    console.error('Khalti payment initiation error:', err);
    throw err;
  }
};

// Initiate eSewa payment (v2 form)
const initiateEsewaPayment = async ({ req, booking, amount, payment }) => {
  try {
    const rawMerchant = process.env.ESEWA_MERCHANT_ID
    const rawSecret = process.env.ESEWA_SECRET_KEY
    const product_code = (rawMerchant ? String(rawMerchant).trim() : 'EPAYTEST')
    const isTest = product_code === 'EPAYTEST'
    const secret = isTest ? '8gBm/:&EnhH.1/q' : (rawSecret ? String(rawSecret).trim() : '') // always use official sandbox secret for EPAYTEST
    if (!secret) {
      throw new Error('ESEWA_SECRET_KEY is not configured for production')
    }
    const backendBase = process.env.BACKEND_URL || `${req?.protocol || 'http'}://${req?.get ? req.get('host') : 'localhost:5000'}`
    const frontendBase = process.env.FRONTEND_URL || 'http://localhost:5173'

    const total_amount = parseFloat(amount).toString()
    const transaction_uuid = `PM_${payment.id}_${booking.id}_${Date.now()}`

    // eSewa v2 signed fields must be in this exact order
    const signed_field_names = 'total_amount,transaction_uuid,product_code'
    const signPayload = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${product_code}`
    const signature = crypto
      .createHmac('sha256', secret)
      .update(signPayload)
      .digest('base64')

    const form_data = {
      amount: total_amount,
      tax_amount: '0',
      total_amount,
      transaction_uuid,
      product_code,
      product_service_charge: '0',
      product_delivery_charge: '0',
      success_url: `${backendBase}/api/payments/esewa/return`,
      failure_url: `${backendBase}/api/payments/esewa/return`,
      signed_field_names,
      signature
    }

    return {
      success: true,
      payment_url: isTest ? `https://rc-epay.esewa.com.np/api/epay/main/v2/form` : `https://epay.esewa.com.np/api/epay/main/v2/form`,
      form_data,
      redirect_hint: `${frontendBase}/booking/confirm/${booking.id}`
    }
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
      const verificationResult = await verifyKhaltiPayment({ token, amount });
      
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

export const handleKhaltiReturn = async (req, res) => {
  try {
    const { pidx, status, purchase_order_id } = req.query || {}
    const frontend = process.env.FRONTEND_URL || 'http://localhost:5173'
    if (!pidx) {
      return res.redirect(`${frontend}/rooms?err=missing_pidx`)
    }

    // Extract booking id from purchase_order_id like BOOKING_123
    let bookingId = null
    if (purchase_order_id && String(purchase_order_id).startsWith('BOOKING_')) {
      bookingId = Number(String(purchase_order_id).split('_')[1])
    }

    // Verify with Khalti using pidx (be resilient to lookup errors)
    let result = null
    const norm = (v) => String(v || '').toLowerCase()
    let completed = ['completed','complete','success','successful','ok','200','201','0','00','000'].includes(norm(status))
    try {
      const lookup = await verifyKhaltiPayment({ pidx })
      result = lookup
      const lookedUp = ['completed','complete','success','successful','ok','200','201','0','00','000'].some(sig => (
        [lookup?.status, lookup?.state, lookup?.code, lookup?.message].map(norm).includes(sig)
      ))
      if (!completed && lookedUp) completed = true
    } catch (e) {
      // Do not fail the whole flow if lookup fails; rely on status query param
      try { console.error('Khalti lookup failed:', e?.message || e) } catch {}
    }

    // If bookingId wasn't present in query, try to derive it from Khalti verification response
    if (!bookingId) {
      try {
        const po = result?.purchase_order_id || result?.purchase_order_name
        if (po && String(po).startsWith('BOOKING_')) {
          const parts = String(po).split('_')
          const maybeId = Number(parts?.[1])
          if (Number.isFinite(maybeId)) bookingId = maybeId
        }
      } catch (_) {}
    }

    if (completed) {
      if (bookingId) {
        // Mark pending khalti payments as completed for this booking
        await prisma.payment.updateMany({
          where: { bookingId, method: 'khalti', status: 'pending' },
          data: { status: 'completed' }
        })
        // Also mark any other pending payments (e.g., default cash placeholder) as completed
        await prisma.payment.updateMany({
          where: { bookingId, status: 'pending' },
          data: { status: 'completed' }
        }).catch(()=>{})
        // Mark booking confirmed
        await prisma.booking.update({ where: { id: bookingId }, data: { status: 'confirmed', updatedAt: new Date() } }).catch(()=>{})
        return res.redirect(`${frontend}/booking/success/${bookingId}`)
      }
      // Fallback: try to infer bookingId from the most recent pending khalti payment
      try {
        const recent = await prisma.payment.findFirst({
          where: { method: 'khalti', status: 'pending' },
          orderBy: { createdAt: 'desc' },
          include: { booking: true }
        })
        if (recent && recent.bookingId) {
          bookingId = recent.bookingId
          await prisma.payment.update({ where: { id: recent.id }, data: { status: 'completed' } }).catch(()=>{})
          await prisma.payment.updateMany({ where: { bookingId, status: 'pending' }, data: { status: 'completed' } }).catch(()=>{})
          await prisma.booking.update({ where: { id: bookingId }, data: { status: 'confirmed', updatedAt: new Date() } }).catch(()=>{})
          return res.redirect(`${frontend}/booking/success/${bookingId}`)
        }
      } catch (_) {}
      // If still unknown, redirect home
      return res.redirect(`${frontend}`)
    } else {
      // Not completed — redirect back to confirmation page to show error state
      const to = bookingId ? `${frontend}/booking/confirm/${bookingId}` : frontend
      return res.redirect(to + `?status=${encodeURIComponent(status || 'failed')}`)
    }
  } catch (err) {
    console.error('Khalti return handler error:', err)
    const frontend = process.env.FRONTEND_URL || 'http://localhost:5173'
    return res.redirect(`${frontend}/rooms?err=verify_failed`)
  }
}

// Handle eSewa success/failure return (supports GET/POST)
export const handleEsewaReturn = async (req, res) => {
  try {
    const frontend = process.env.FRONTEND_URL || 'http://localhost:5173'
    const data = Object.assign({}, req.query || {}, req.body || {})
    // Prefer official eSewa v2 'data' param (base64 JSON) when provided
    let payload = null
    try {
      const base64 = data?.data || data?.encoded_data
      if (base64 && typeof base64 === 'string') {
        const json = Buffer.from(base64, 'base64').toString('utf8')
        payload = JSON.parse(json)
      }
    } catch (_) {}
    // Extract fields from decoded payload, otherwise fall back to query/body
    let transaction_uuid = payload?.transaction_uuid || data?.transaction_uuid || data?.ctx
    let total_amount = payload?.total_amount || data?.total_amount || data?.amount
    const transaction_code = payload?.transaction_code || data?.transaction_code
    const signed_field_names = payload?.signed_field_names
    const returned_signature = payload?.signature

    if (!transaction_uuid) {
      return res.redirect(`${frontend}/rooms?err=missing_uuid`)
    }

    // attempt to parse payment id from transaction_uuid pattern PM_<paymentId>_<bookingId>_ts
    let paymentId = null
    let bookingId = null
    if (String(transaction_uuid).startsWith('PM_')) {
      const parts = String(transaction_uuid).split('_')
      paymentId = Number(parts?.[1]) || null
      bookingId = Number(parts?.[2]) || null
    }

    // If eSewa didn't return total_amount, fallback to our stored payment amount
    if (!total_amount && paymentId) {
      try {
        const p = await prisma.payment.findUnique({ where: { id: paymentId } })
        if (p && p.amount != null) {
          total_amount = parseFloat(p.amount).toString()
        }
      } catch (_) {}
    }

    // Sanitize values before verification
    const clean_uuid = String(transaction_uuid).split('?')[0]
    const clean_amount = total_amount != null ? String(total_amount) : undefined

    // Diagnostic log (safe): what we received from eSewa return (no secrets)
    try { console.log('[eSewa:return] payload', { q: req.query, b: req.body, transaction_uuid: clean_uuid, total_amount: clean_amount }) } catch {}

    // Try local signature verification when possible
    let ok = false
    const rawMerchant = process.env.ESEWA_MERCHANT_ID
    const product_code = (rawMerchant ? String(rawMerchant).trim() : 'EPAYTEST')
    const isTest = product_code === 'EPAYTEST'
    const rawSecret = process.env.ESEWA_SECRET_KEY
    const secret = isTest ? '8gBm/:&EnhH.1/q' : (rawSecret ? String(rawSecret).trim() : '')

    // In sandbox, accept if payload reports a success status
    const statusStr = String(payload?.status || '').toLowerCase()
    if (isTest && ['complete','completed','success','successful','ok'].includes(statusStr)) {
      ok = true
    }

    if (signed_field_names && returned_signature && secret) {
      try {
        // Build sign payload based on provided order
        const fields = String(signed_field_names).split(',').map(s => s.trim()).filter(Boolean)
        const signPayload = fields.map(k => `${k}=${payload?.[k]}`).join(',')
        const expected = crypto.createHmac('sha256', secret).update(signPayload).digest('base64')
        ok = expected === returned_signature
      } catch (_) {
        ok = false
      }
    }

    // If sandbox, do not call status API; rely on payload/signature only
    let result = { success: ok }
    if (!isTest && !ok) {
      // Production: fallback to status API
      result = await verifyEsewaPayment({ total_amount: clean_amount, transaction_uuid: clean_uuid, transaction_code })
      ok = !!result?.success
    }

    if (ok) {
      if (paymentId) {
        await prisma.payment.update({ where: { id: paymentId }, data: { status: 'completed' } }).catch(()=>{})
      }
      if (bookingId) {
        // Also mark any other pending payments (e.g., default cash placeholder) as completed
        await prisma.payment.updateMany({ where: { bookingId, status: 'pending' }, data: { status: 'completed' } }).catch(()=>{})
        await prisma.booking.update({ where: { id: bookingId }, data: { status: 'confirmed', updatedAt: new Date() } }).catch(()=>{})
        // Send booking success email for eSewa payments
        try {
          const completeBooking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: { guest: true, room: true }
          });
          if (completeBooking) {
            await sendBookingSuccessEmail(completeBooking);
          }
        } catch (emailError) {
          console.error('Failed to send booking success email for eSewa:', emailError);
          // Don't fail the payment flow if email fails
        }
        return res.redirect(`${frontend}/booking/success/${bookingId}`)
      }
      return res.redirect(frontend)
    }

    const to = bookingId ? `${frontend}/booking/confirm/${bookingId}` : frontend
    const reason = encodeURIComponent(result?.message || result?.raw?.message || result?.raw?.status || result?.raw?.state || result?.raw?.response_code || 'failed')
    return res.redirect(to + `?status=failed&reason=${reason}`)
  } catch (err) {
    console.error('eSewa return handler error:', err)
    const frontend = process.env.FRONTEND_URL || 'http://localhost:5173'
    return res.redirect(`${frontend}/rooms?err=esewa_failed`)
  }
}

// Verify eSewa payment via status API (v2)
const verifyEsewaPayment = async (paymentData) => {
  try {
    const rawMerchant = process.env.ESEWA_MERCHANT_ID
    const rawSecret = process.env.ESEWA_SECRET_KEY
    const product_code = (rawMerchant ? String(rawMerchant).trim() : 'EPAYTEST')
    const isTest = product_code === 'EPAYTEST'
    const secret = isTest ? '8gBm/:&EnhH.1/q' : (rawSecret ? String(rawSecret).trim() : '')
    const { total_amount, transaction_uuid, transaction_code } = paymentData || {}

    if (!total_amount || !transaction_uuid) {
      return { success: false, message: 'Missing required fields' }
    }

    const url = isTest
      ? `https://rc-epay.esewa.com.np/api/epay/transaction/status/`
      : `https://epay.esewa.com.np/api/epay/transaction/status/`

    return await new Promise((resolve) => {
      const clean_uuid = String(transaction_uuid).split('?')[0]
      const clean_amount = String(total_amount)
      const signed_field_names = 'total_amount,transaction_uuid,product_code'
      const signPayload = `total_amount=${clean_amount},transaction_uuid=${clean_uuid},product_code=${product_code}`
      const signature = crypto.createHmac('sha256', secret).update(signPayload).digest('base64')

      const options = {
        method: 'POST',
        url,
        headers: {
          Authorization: 'Basic ' + Buffer.from(`${product_code}:${secret}`).toString('base64'),
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        auth: {
          user: product_code,
          pass: secret,
          sendImmediately: true
        },
        body: JSON.stringify({
          product_code: product_code,
          total_amount: clean_amount,
          transaction_uuid: clean_uuid,
          ...(transaction_code ? { transaction_code: String(transaction_code) } : {}),
          signed_field_names,
          signature
        })
      }
      try { console.log('[eSewa:status] req', { url, product_code, isTest }) } catch {}
      request(options, function (error, response) {
        if (error) {
          console.error('eSewa status error:', error)
          return resolve({ success: false, message: 'status_error' })
        }
        try {
          const data = JSON.parse(response.body)
          try { console.log('[eSewa:status] resp', { code: response.statusCode, data }) } catch {}
          const statusStr = String(data?.status || data?.state || data?.code || '').toLowerCase()
          const respCode = String(data?.response_code || '').toLowerCase()
          const completed = ['complete','completed','success','successful','ok'].includes(statusStr) || ['success','successful','ok','0','00','000'].includes(respCode)
          resolve({ success: !!completed, raw: data })
        } catch (_) {
          resolve({ success: false, message: 'parse_error' })
        }
      })
    })
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
      include: {
        booking: {
          include: {
            room: true,
            guest: true,
            extraServices: {
              include: {
                extraService: true
              }
            }
          }
        }
      },
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
