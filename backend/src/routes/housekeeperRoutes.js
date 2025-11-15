import express from "express";
import upload from "../middleware/upload.js";
import { listHousekeepers, getHousekeeper, createHousekeeper, updateHousekeeper, uploadHousekeeperPhoto, deleteHousekeeperPhoto, deleteHousekeeper, resetHousekeeperPassword } from "../controllers/hk/housekeeperController.js";

const router = express.Router();

router.get("/", listHousekeepers);
router.get("/:id", getHousekeeper);
router.post("/", createHousekeeper);
router.put("/:id", updateHousekeeper);
router.delete("/:id", deleteHousekeeper);
router.post("/:id/photo", upload.single('file'), uploadHousekeeperPhoto);
router.delete("/:id/photo", deleteHousekeeperPhoto);
router.put("/:id/reset-password", resetHousekeeperPassword);

export default router;
