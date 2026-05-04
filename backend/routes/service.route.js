import { Router } from "express";
import {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  getMyServices,
  rateService,
} from "../controllers/service.controller.js";
import { verifyToken, authorizeRoles } from "../middleware/auth.middleware.js";
import upload from "../config/multer.js";

const router = Router();

// Public routes
router.get("/", getServices);

// Protected routes for providers - all authenticated users can create/manage services
router.post(
  "/",
  verifyToken,
  upload.array("images", 5),
  createService
);

// Specific named routes (must come before /:id)
router.get(
  "/my/listings",
  verifyToken,
  getMyServices
);

// Generic ID routes (must come last)
router.get("/:id", getServiceById);

router.put(
  "/:id",
  verifyToken,
  upload.array("images", 5),
  updateService
);

router.delete(
  "/:id",
  verifyToken,
  deleteService
);

router.put(
  "/:id/rating",
  verifyToken,
  rateService
);

export default router;
