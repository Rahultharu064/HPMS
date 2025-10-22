import express from "express";
import {
  getFacilities,
  getFacilityById,
  createFacility,
  updateFacility,
  deleteFacility
} from "../controllers/facilityController.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// List with optional filters
router.get("/", getFacilities);

// Get by id or slug
router.get("/:id", getFacilityById);

// Admin CRUD (stubs for now)
router.post(
  "/",
  upload.fields([
    { name: "images", maxCount: 10 }
  ]),
  createFacility
);
router.put(
  "/:id",
  upload.fields([
    { name: "images", maxCount: 10 }
  ]),
  updateFacility
);
router.delete("/:id", deleteFacility);

export default router;
