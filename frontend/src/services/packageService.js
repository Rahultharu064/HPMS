import axios from 'axios'
import { API_BASE_URL } from '../utils/api'

const API_URL = `${API_BASE_URL}/packages`

class PackageService {
  async getAllPackages() {
    try {
      const response = await axios.get(API_URL)
      return response.data
    } catch (error) {
      console.error('Error fetching packages:', error)
      throw error
    }
  }

  async getPackageById(id) {
    try {
      const response = await axios.get(`${API_URL}/${id}`)
      return response.data
    } catch (error) {
      console.error('Error fetching package:', error)
      throw error
    }
  }

  async createPackage(packageData) {
    try {
      const response = await axios.post(API_URL, packageData)
      return response.data
    } catch (error) {
      console.error('Error creating package:', error)
      throw error
    }
  }

  async updatePackage(id, packageData) {
    try {
      const response = await axios.put(`${API_URL}/${id}`, packageData)
      return response.data
    } catch (error) {
      console.error('Error updating package:', error)
      throw error
    }
  }

  async deletePackage(id) {
    try {
      const response = await axios.delete(`${API_URL}/${id}`)
      return response.data
    } catch (error) {
      console.error('Error deleting package:', error)
      throw error
    }
  }
}

export const packageService = new PackageService()
