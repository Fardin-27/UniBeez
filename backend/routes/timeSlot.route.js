import { Router } from "express";
import {
  createTimeSlot,
  getTimeSlots,
  getMyTimeSlots,
  updateTimeSlot,
  deleteTimeSlot,
} from "../controllers/timeSlot.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = Router();

// Public route - get available time slots for a service (no auth needed)
router.get("/:serviceId", getTimeSlots);

// All routes below require authentication
router.use(verifyToken);

router.post("/", createTimeSlot);

router.get("/provider/my", getMyTimeSlots);

router.put("/:id", updateTimeSlot);

router.delete("/:id", deleteTimeSlot);

export default router;
