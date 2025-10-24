import app from "./app.js"
import http from "http"
import { Server as SocketIOServer } from "socket.io"
import { setIO } from "./socket.js"

const PORT = process.env.PORT || 5003

const server = http.createServer(app)

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174"
]

const io = new SocketIOServer(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback(new Error("Not allowed by CORS"))
      }
    },
    credentials: true
  }
})

setIO(io)

io.on("connection", (socket) => {
  // console.log("HK client connected", socket.id)
  socket.on("disconnect", () => {
    // console.log("HK client disconnected", socket.id)
  })
})

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})