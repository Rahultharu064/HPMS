import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { API_BASE_URL } from '../utils/api'

export const createRoom = createAsyncThunk('room/createRoom', async (payload, { rejectWithValue }) => {
  try {
    const formData = new FormData()
    formData.append('name', payload.name)
    formData.append('roomType', payload.roomType)
    formData.append('roomNumber', payload.roomNumber)
    formData.append('floor', String(payload.floor))
    formData.append('price', String(payload.price))
    formData.append('size', String(payload.size))
    formData.append('maxAdults', String(payload.maxAdults))
    if (payload.maxChildren !== undefined && payload.maxChildren !== null) formData.append('maxChildren', String(payload.maxChildren))
    formData.append('numBeds', String(payload.numBeds))
    formData.append('allowChildren', String(Boolean(payload.allowChildren)))
    formData.append('description', payload.description)
    if (payload.status) formData.append('status', payload.status)
    if (payload.amenities && payload.amenities.length) formData.append('amenities', JSON.stringify(payload.amenities))
    if (payload.images && payload.images.length) {
      for (const file of payload.images) formData.append('images', file)
    }
    if (payload.videos && payload.videos.length) {
      for (const file of payload.videos) formData.append('videos', file)
    }

    const res = await fetch(`${API_BASE_URL}/api/rooms`, {
      method: 'POST',
      body: formData,
    })
    const data = await res.json()
    if (!res.ok || !data.success) return rejectWithValue(data.error || 'Failed to create room')
    return data.room
  } catch (err) {
    return rejectWithValue(err.message || 'Network error')
  }
})

const slice = createSlice({
  name: 'room',
  initialState: { creating: false, createError: null, createdRoom: null },
  reducers: {
    resetCreatedRoom: (state) => { state.createdRoom = null; state.createError = null },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createRoom.pending, (state) => { state.creating = true; state.createError = null; state.createdRoom = null })
      .addCase(createRoom.fulfilled, (state, action) => { state.creating = false; state.createdRoom = action.payload })
      .addCase(createRoom.rejected, (state, action) => { state.creating = false; state.createError = action.payload || 'Error' })
  }
})

export const { resetCreatedRoom } = slice.actions
export default slice.reducer
