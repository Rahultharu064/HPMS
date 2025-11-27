import express from "express";
import { getSettings, updateSettings, getServiceCharge, updateServiceCharge } from "../controllers/settingsController.js";

const router = express.Router();

router.get("/", getSettings);
router.put("/", updateSettings);

// Service charge routes
router.get("/service-charge", getServiceCharge);
router.put("/service-charge", updateServiceCharge);

export default router;
