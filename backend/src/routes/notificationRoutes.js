import express from "express";
import { listNotifications, markRead } from "../controllers/notificationController.js";

const router = express.Router();

router.get("/", listNotifications);
router.put("/:id/read", markRead);

export default router;
