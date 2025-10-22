import express from "express";
import upload from "../middleware/upload.js";
import { validateBody } from "../middleware/validate.js";
import { roomSchema } from "../validation/roomValidation.js";
import { reviewSchema } from "../validation/reviewValidation.js";
import {
  createRoom,
  getAllRooms,
  getRoomById,
  updateRoom,
  deleteRoom,
  getFeaturedRooms,
  getSimilarRooms,
  getRoomReviews,
  addRoomReview,
  getRoomsStatusMap,
  updateRoomStatus
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

// Housekeeping status map (place before parameterized routes)
router.get("/status-map", getRoomsStatusMap);

// Get featured rooms
router.get("/featured", getFeaturedRooms);

// Get by id
router.get("/:id", getRoomById);

// Update room status (housekeeping)
router.put("/:id/status", updateRoomStatus);

// Get similar rooms
router.get("/:id/similar", getSimilarRooms);

// Reviews
router.get("/:id/reviews", getRoomReviews);
router.post("/:id/reviews", validateBody(reviewSchema), addRoomReview);

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
