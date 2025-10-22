import express from "express";
import upload from "../middleware/upload.js";
import { listTasks, createTask, getTaskById, updateTask, deleteTask, addTaskAttachments } from "../controllers/hk/tasksController.js";
import { listCleaningLogs, createCleaningLog } from "../controllers/hk/cleaningController.js";

const router = express.Router();

// Tasks
router.get("/tasks", listTasks);
router.post("/tasks", createTask);
router.get("/tasks/:id", getTaskById);
router.put("/tasks/:id", updateTask);
router.delete("/tasks/:id", deleteTask);
router.post("/tasks/:id/attachments", upload.array("files", 10), addTaskAttachments);

// Cleaning Logs
router.get("/cleaning-logs", listCleaningLogs);
router.post("/cleaning-logs", createCleaningLog);

export default router;
