import { apiRequest, apiDebug } from '../utils/api'

export const paymentService = {
  // Get available payment gateways
  async getGateways() {
    try {
      return await apiRequest('/api/payments/gateways')
    } catch (error) {
      apiDebug.error('Error fetching payment gateways:', error)
      throw error
    }
  },

  // Get all payments (admin)
  async getAllPayments(params = {}) {
    try {
      const query = new URLSearchParams(params).toString()
      const url = query ? `/api/payments?${query}` : '/api/payments'
      return await apiRequest(url)
    } catch (error) {
      apiDebug.error('Error fetching all payments:', error)
      throw error
    }
  },

  // Manually mark a payment as completed
  async completePayment(paymentId) {
    try {
      return await apiRequest(`/api/payments/${paymentId}/complete`, {
        method: 'POST'
      })
    } catch (error) {
      apiDebug.error('Error completing payment:', error)
      throw error
    }
  },

  // Create payment
  async createPayment({ bookingId, serviceOrderId, method, amount, gatewayData }) {
    try {
      const payload = { bookingId, serviceOrderId, method, amount, gatewayData }
      apiDebug.log('Creating payment with payload:', payload)
      return await apiRequest('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
    } catch (error) {
      apiDebug.error('Error creating payment:', error)
      throw error
    }
  },

  // Verify payment
  async verifyPayment(paymentId, gateway, token, amount) {
    try {
      const payload = { token, amount }
      apiDebug.log('Verifying payment:', { paymentId, gateway, payload })
      return await apiRequest(`/api/payments/${paymentId}/verify/${gateway}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
    } catch (error) {
      apiDebug.error('Error verifying payment:', error)
      throw error
    }
  },

  // Get payment history for a booking
  async getPaymentHistory(bookingId) {
    try {
      return await apiRequest(`/api/payments/history/${bookingId}`)
    } catch (error) {
      apiDebug.error('Error fetching payment history:', error)
      throw error
    }
  },

  // Refund payment
  async refundPayment(paymentId, reason) {
    try {
      const payload = { reason }
      apiDebug.log('Refunding payment:', { paymentId, reason })
      return await apiRequest(`/api/payments/${paymentId}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
    } catch (error) {
      apiDebug.error('Error refunding payment:', error)
      throw error
    }
  },

  // Handle Khalti payment
  async handleKhaltiPayment(paymentData) {
    try {
      const { payment_url } = paymentData.gatewayResponse;

      // Redirect to Khalti payment page
      if (payment_url) {
        window.location.href = payment_url;
      }

      return paymentData;
    } catch (error) {
      apiDebug.error('Error handling Khalti payment:', error)
      throw error
    }
  },

  // Handle eSewa payment
  async handleEsewaPayment(paymentData) {
    try {
      const { payment_url, form_data } = paymentData.gatewayResponse;

      if (payment_url && form_data) {
        // Create form and submit to eSewa
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = payment_url;
        form.target = '_self';

        Object.keys(form_data).forEach(key => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = form_data[key];
          form.appendChild(input);
        });

        document.body.appendChild(form);

        // Use setTimeout to ensure form is fully in DOM before submission
        setTimeout(() => {
          form.submit();
          // Remove form after submission to clean up
          setTimeout(() => {
            if (document.body.contains(form)) {
              document.body.removeChild(form);
            }
          }, 1000);
        }, 100);
      }

      return paymentData;
    } catch (error) {
      apiDebug.error('Error handling eSewa payment:', error)
      throw error
    }
  }
}
