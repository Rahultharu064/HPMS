import express from "express";
import upload from "../middleware/upload.js";
import { listHousekeepers, getHousekeeper, createHousekeeper, updateHousekeeper, uploadHousekeeperPhoto, deleteHousekeeperPhoto } from "../controllers/hk/housekeeperController.js";

const router = express.Router();

router.get("/", listHousekeepers);
router.get("/:id", getHousekeeper);
router.post("/", createHousekeeper);
router.put("/:id", updateHousekeeper);
router.post("/:id/photo", upload.single('file'), uploadHousekeeperPhoto);
router.delete("/:id/photo", deleteHousekeeperPhoto);

export default router;
