import express from "express";
import cors from "cors";
import path from "path";
import roomRoutes from "./routes/roomRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import guestRoutes from "./routes/guestRoutes.js";
import paymentRoutes from "./routes/paymentsRoutes.js";
import hkRoutes from "./routes/hkRoutes.js";
import facilityRoutes from "./routes/facilityRoutes.js";
import dotenv from "dotenv";
import prisma from "./config/client.js";
dotenv.config();

const app = express();
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174"
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // for form submissions that send text fields
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));




app.use("/api/rooms", roomRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/guests", guestRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/hk", hkRoutes);
app.use("/api/facilities", facilityRoutes);

app.get("/", (req, res) => res.send("HPMS API running"));

export default app;
