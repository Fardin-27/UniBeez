// Admin & Feedback module
import { Router } from "express";
import {
  submitDispute,
  getMyDisputes,
  getDisputeById,
  getAllDisputes,
  resolveDispute,
} from "../controllers/dispute.controller.js";
import { verifyToken, authorizeRoles } from "../middleware/auth.middleware.js";

const router = Router();

router.use(verifyToken);

router.post("/", submitDispute);
router.get("/my", getMyDisputes);
router.get("/:id", getDisputeById);

router.get("/", authorizeRoles("admin"), getAllDisputes);
router.patch("/:id/resolve", authorizeRoles("admin"), resolveDispute);

export default router;
