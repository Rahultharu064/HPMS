import axios from 'axios'
import { API_BASE_URL } from '../utils/api'

const API_URL = `${API_BASE_URL}/coupons`

class CouponService {
  async getAllCoupons() {
    try {
      const response = await axios.get(API_URL)
      return response.data
    } catch (error) {
      console.error('Error fetching coupons:', error)
      throw error
    }
  }

  async getCouponById(id) {
    try {
      const response = await axios.get(`${API_URL}/${id}`)
      return response.data
    } catch (error) {
      console.error('Error fetching coupon:', error)
      throw error
    }
  }

  async createCoupon(couponData) {
    try {
      const response = await axios.post(API_URL, couponData)
      return response.data
    } catch (error) {
      console.error('Error creating coupon:', error)
      throw error
    }
  }

  async updateCoupon(id, couponData) {
    try {
      const response = await axios.put(`${API_URL}/${id}`, couponData)
      return response.data
    } catch (error) {
      console.error('Error updating coupon:', error)
      throw error
    }
  }

  async deleteCoupon(id) {
    try {
      const response = await axios.delete(`${API_URL}/${id}`)
      return response.data
    } catch (error) {
      console.error('Error deleting coupon:', error)
      throw error
    }
  }

  async validateCoupon(code) {
    try {
      const response = await axios.post(`${API_URL}/validate`, { code })
      return response.data
    } catch (error) {
      console.error('Error validating coupon:', error)
      throw error
    }
  }
}

export const couponService = new CouponService()
