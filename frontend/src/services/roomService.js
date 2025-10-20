import { API_BASE_URL, apiRequest, apiDebug } from '../utils/api'

export const roomService = {
  // Get all rooms with pagination and filters
  async getRooms(page = 1, limit = 10, filters = {}) {
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters
      })
      
      return await apiRequest(`/api/rooms?${queryParams}`)
    } catch (error) {
      apiDebug.error('Error fetching rooms:', error)
      throw error
    }
  },

  // Get single room by ID
  async getRoomById(id) {
    try {
      return await apiRequest(`/api/rooms/${id}`)
    } catch (error) {
      apiDebug.error('Error fetching room:', error)
      throw error
    }
  },

  // Get featured rooms
  async getFeaturedRooms() {
    try {
      return await apiRequest('/api/rooms/featured')
    } catch (error) {
      apiDebug.error('Error fetching featured rooms:', error)
      throw error
    }
  },

  // Get similar rooms
  async getSimilarRooms(id) {
    try {
      return await apiRequest(`/api/rooms/${id}/similar`)
    } catch (error) {
      apiDebug.error('Error fetching similar rooms:', error)
      throw error
    }
  },

  // Delete room
  async deleteRoom(id) {
    try {
      apiDebug.log('Attempting to delete room with ID:', id)
      const result = await apiRequest(`/api/rooms/${id}`, {
        method: 'DELETE'
      })
      apiDebug.log('Room deleted successfully:', result)
      return result
    } catch (error) {
      apiDebug.error('Error deleting room:', error)
      
      // Provide more specific error messages
      if (error.message.includes('Room not found')) {
        throw new Error('Room not found. It may have already been deleted.')
      } else if (error.message.includes('Failed to delete room')) {
        throw new Error('Failed to delete room. Please check the backend logs for details.')
      }
      
      throw error
    }
  },

  // Create room
  async createRoom(roomData) {
    try {
      const formData = new FormData()
      
      // Add text fields
      Object.keys(roomData).forEach(key => {
        if (key !== 'images' && key !== 'videos') {
          formData.append(key, roomData[key])
        }
      })
      
      // Add files
      if (roomData.images) {
        roomData.images.forEach(image => {
          formData.append('images', image)
        })
      }
      
      if (roomData.videos) {
        roomData.videos.forEach(video => {
          formData.append('videos', video)
        })
      }
      
      const response = await fetch(`${API_BASE_URL}/api/rooms`, {
        method: 'POST',
        body: formData
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create room')
      }
      
      return data
    } catch (error) {
      console.error('Error creating room:', error)
      throw error
    }
  },

  // Update room
  async updateRoom(id, roomData) {
    try {
      const formData = new FormData()
      
      // Add text fields
      Object.keys(roomData).forEach(key => {
        if (key !== 'images' && key !== 'videos') {
          formData.append(key, roomData[key])
        }
      })
      
      // Add files
      if (roomData.images) {
        roomData.images.forEach(image => {
          formData.append('images', image)
        })
      }
      
      if (roomData.videos) {
        roomData.videos.forEach(video => {
          formData.append('videos', video)
        })
      }
      
      const response = await fetch(`${API_BASE_URL}/api/rooms/${id}`, {
        method: 'PUT',
        body: formData
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update room')
      }
      
      return data
    } catch (error) {
      console.error('Error updating room:', error)
      throw error
    }
  }
}
