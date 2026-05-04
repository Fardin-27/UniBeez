import { Router } from "express";
import { getActivityHistory } from "../controllers/activity.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/history", verifyToken, getActivityHistory);

export default router;
