import express from "express";
import cors from "cors";
import path from "path";
import roomRoutes from "./routes/roomRoutes.js";
import roomTypeRoutes from "./routes/roomTypeRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import guestRoutes from "./routes/guestRoutes.js";
import paymentRoutes from "./routes/paymentsRoutes.js";
import hkRoutes from "./routes/hkRoutes.js";
import facilityRoutes from "./routes/facilityRoutes.js";
import housekeeperRoutes from "./routes/housekeeperRoutes.js";
import frontOfficeStaffRoutes from "./routes/frontOfficeStaffRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import packageRoutes from "./routes/packageRoutes.js";
import promotionRoutes from "./routes/promotionRoutes.js";
import couponRoutes from "./routes/couponRoutes.js";
import extraServiceRoutes from "./routes/extraServiceRoutes.js";
import serviceCategoryRoutes from "./routes/serviceCategoryRoutes.js";
import serviceOrderRoutes from "./routes/serviceOrderRoutes.js";
import testimonialRoutes from "./routes/testimonialRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import dotenv from "dotenv";
import prisma from "./config/client.js";
import passport from "../src/config/passport.js";

import session from "express-session";
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
app.use(session({
  secret: process.env.SESSION_SECRET || "default_secret",
  resave: false,
  saveUninitialized: false,

}));
app.use(passport.initialize());
app.use(passport.session());






app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/room-types", roomTypeRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/guests", guestRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/hk", hkRoutes);
app.use("/api/facilities", facilityRoutes);
app.use("/api/housekeepers", housekeeperRoutes);
app.use("/api/front-office-staff", frontOfficeStaffRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/packages", packageRoutes);
app.use("/api/promotions", promotionRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/extra-services", extraServiceRoutes);
app.use("/api/service-categories", serviceCategoryRoutes);
app.use("/api/service-orders", serviceOrderRoutes);
app.use("/api/testimonials", testimonialRoutes);

app.get("/", (req, res) => res.send("HPMS API running"));

export default app;
