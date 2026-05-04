// Module: Authentication & User Management – developed by Member 1
import { Router } from "express";
import {
  getAllUsers,
  getUserById,
  updateProfile,
  changeUserRole,
  toggleUserStatus,
  toggleUserRestriction,
} from "../controllers/user.controller.js";
import { verifyToken, authorizeRoles } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", verifyToken, authorizeRoles("admin"), getAllUsers);
router.get("/:id", verifyToken, getUserById);
router.put("/profile", verifyToken, updateProfile);
router.patch("/:id/role", verifyToken, authorizeRoles("admin"), changeUserRole);
router.patch("/:id/status", verifyToken, authorizeRoles("admin"), toggleUserStatus);
router.put("/:id/toggle-status", verifyToken, authorizeRoles("admin"), toggleUserRestriction);

export default router;
