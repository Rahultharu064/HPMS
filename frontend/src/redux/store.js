import { configureStore } from '@reduxjs/toolkit'
import roomReducer from './roomSlice'

export const store = configureStore({
  reducer: {
    room: roomReducer,
  },
})

export default store
