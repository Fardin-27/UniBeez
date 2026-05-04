// Module: Authentication & User Management – developed by Member 1
import { Router } from "express";
import { register, login, getProfile, logout } from "../controllers/auth.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/profile", verifyToken, getProfile);
router.post("/logout", verifyToken, logout);

export default router;
