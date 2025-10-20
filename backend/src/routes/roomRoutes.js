import express from "express";
import upload from "../middleware/upload.js";
import { validateBody } from "../middleware/validate.js";
import { roomSchema } from "../validation/roomValidation.js";
import {
  createRoom,
  getAllRooms,
  getRoomById,
  updateRoom,
  deleteRoom
} from "../controllers/roomController.js";

const router = express.Router();

// Create room (multipart/form-data)
router.post(
  "/",
  upload.fields([
    { name: "images", maxCount: 10 },
    { name: "videos", maxCount: 3 }
  ]),
  validateBody(roomSchema),
  createRoom
);

// Get all (search/filter/pagination)
router.get("/", getAllRooms);

// Get by id
router.get("/:id", getRoomById);

// Update (optionally upload new images/videos to replace)
router.put(
  "/:id",
  upload.fields([
    { name: "images", maxCount: 10 },
    { name: "videos", maxCount: 3 }
  ]),
  // optional: you can validate body for update too; skipping strict validation here to allow partial updates
  updateRoom
);

// Delete
router.delete("/:id", deleteRoom);

export default router;
