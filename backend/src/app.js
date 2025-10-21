import express from "express";
import cors from "cors";
import path from "path";
import roomRoutes from "./routes/roomRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import guestRoutes from "./routes/guestRoutes.js";
import paymentRoutes from "./routes/paymentsRoutes.js";
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

// Ensure reviews table exists (for setups without running Prisma CLI migrations)
async function ensureReviewsTable() {
  try {
    await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS \`review\` (
      \`id\` INTEGER NOT NULL AUTO_INCREMENT,
      \`roomId\` INTEGER NOT NULL,
      \`name\` VARCHAR(191) NOT NULL,
      \`rating\` INTEGER NOT NULL,
      \`comment\` TEXT NOT NULL,
      \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      PRIMARY KEY (\`id\`),
      CONSTRAINT \`review_roomId_fkey\` FOREIGN KEY (\`roomId\`) REFERENCES \`room\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`;
  } catch (e) {
    console.error("Failed ensuring reviews table:", e.message);
  }
}

ensureReviewsTable();

app.use("/api/rooms", roomRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/guests", guestRoutes);
app.use("/api/payments", paymentRoutes);

app.get("/", (req, res) => res.send("HPMS API running"));

export default app;
