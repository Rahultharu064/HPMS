import { io } from 'socket.io-client'
import { API_BASE_URL } from './api'

let socket = null

export const getSocket = () => {
  if (!socket) {
    socket = io(API_BASE_URL, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
    })
  }
  return socket
}

export const closeSocket = () => {
  if (socket) {
    socket.close()
    socket = null
  }
}
