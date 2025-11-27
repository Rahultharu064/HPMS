import { API_BASE_URL, apiRequest, apiDebug } from '../utils/api'

export const roomTypeService = {
  // Get all room types with pagination and filters
  async getRoomTypes(page = 1, limit = 10, filters = {}) {
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters
      })

      return await apiRequest(`/api/room-types?${queryParams}`)
    } catch (error) {
      apiDebug.error('Error fetching room types:', error)
      throw error
    }
  },

  // Get single room type by ID
  async getRoomTypeById(id) {
    try {
      return await apiRequest(`/api/room-types/${id}`)
    } catch (error) {
      apiDebug.error('Error fetching room type:', error)
      throw error
    }
  },

  // Create room type
  async createRoomType(roomTypeData) {
    try {
      return await apiRequest('/api/room-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: roomTypeData.name, code: roomTypeData.code })
      })
    } catch (error) {
      apiDebug.error('Error creating room type:', error)
      throw error
    }
  },

  // Update room type
  async updateRoomType(id, roomTypeData) {
    try {
      return await apiRequest(`/api/room-types/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: roomTypeData.name, code: roomTypeData.code })
      })
    } catch (error) {
      apiDebug.error('Error updating room type:', error)
      throw error
    }
  },

  // Delete room type
  async deleteRoomType(id) {
    try {
      return await apiRequest(`/api/room-types/${id}`, {
        method: 'DELETE'
      })
    } catch (error) {
      apiDebug.error('Error deleting room type:', error)
      throw error
    }
  }
}
