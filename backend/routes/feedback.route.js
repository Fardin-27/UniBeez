import { Router } from "express";
import {
  submitOrderFeedback,
  submitBookingFeedback,
  getReceivedFeedback,
  getGivenFeedback,
  getPublicFeedback,
} from "../controllers/feedback.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/public", getPublicFeedback);
router.get("/received", verifyToken, getReceivedFeedback);
router.get("/given", verifyToken, getGivenFeedback);
router.post("/orders/:orderId", verifyToken, submitOrderFeedback);
router.post("/bookings/:bookingId", verifyToken, submitBookingFeedback);

export default router;
