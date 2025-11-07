import express from "express";
import { validateBody } from "../middleware/validate.js";
import {
  getAllRoomTypes,
  getRoomTypeById,
  createRoomType,
  updateRoomType,
  deleteRoomType
} from "../controllers/roomTypeController.js";

const router = express.Router();

// Get all room types
router.get("/", getAllRoomTypes);

// Get single room type
router.get("/:id", getRoomTypeById);

// Create room type
router.post("/", createRoomType);

// Update room type
router.put("/:id", updateRoomType);

// Delete room type
router.delete("/:id", deleteRoomType);

export default router;
