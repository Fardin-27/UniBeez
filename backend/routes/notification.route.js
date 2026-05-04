// Admin & Feedback module
import express from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../controllers/notification.controller.js";
import { createNotification } from "../lib/notify.js";

const router = express.Router();

router.use(verifyToken);

router.get("/", getNotifications);
router.get("/unread-count", getUnreadCount);
router.patch("/read-all", markAllAsRead);
router.patch("/:id/read", markAsRead);
router.delete("/:id", deleteNotification);

// Test endpoint for notification creation
router.post("/test", async (req, res) => {
  try {
    const { recipient, sender, type, title, body, link, entityId, entityType } = req.body;
    await createNotification({ recipient, sender, type, title, body, link, entityId, entityType });
    res.status(200).json({ success: true, message: "Notification created successfully" });
  } catch (error) {
    console.error("[notification.test] Error:", error);
    res.status(500).json({ success: false, message: "Failed to create notification", error: error.message });
  }
});

export default router;
