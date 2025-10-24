import express from "express";
import upload from "../middleware/upload.js";

import { listCleaningLogs, createCleaningLog, startCleaning, finishCleaning, listCleaningSchedule } from "../controllers/hk/cleaningController.js";
import { listTasks, createTask, updateTask, deleteTask, addAttachment } from "../controllers/hk/taskController.js";

const router = express.Router();



// Cleaning Logs
router.get("/cleaning-logs", listCleaningLogs);
router.post("/cleaning-logs", createCleaningLog);
router.post("/cleaning/start", startCleaning);
router.post("/cleaning/finish", finishCleaning);
// Cleaning Schedule
router.get("/schedule", listCleaningSchedule);

// Housekeeping Tasks
router.get("/tasks", listTasks);
router.post("/tasks", createTask);
router.put("/tasks/:id", updateTask);
router.delete("/tasks/:id", deleteTask);
router.post("/tasks/:id/attachments", upload.single('file'), addAttachment);

export default router;
