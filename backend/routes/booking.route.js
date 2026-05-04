import { Router } from "express";
import {
  createBooking,
  getMyBookings,
  getBookingById,
  approveBooking,
  rejectBooking,
  completeBooking,
  cancelBooking,
} from "../controllers/booking.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = Router();

// All booking routes require authentication
router.use(verifyToken);

// Create booking (buyers)
router.post("/", createBooking);

// Get user's bookings (for both buyers and providers)
router.get("/", getMyBookings);

// Get specific booking details
router.get("/:id", getBookingById);

// Provider routes - manage bookings
router.put("/:id/approve", approveBooking);
router.put("/:id/reject", rejectBooking);
router.put("/:id/complete", completeBooking);

// Cancel booking (both buyer and provider can cancel)
router.put("/:id/cancel", cancelBooking);

export default router;
