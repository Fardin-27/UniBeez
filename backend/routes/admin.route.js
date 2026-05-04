// Admin & Feedback module
import { Router } from "express";
import {
  getAnalytics,
  getFlaggedContent,
  flagProduct,
  getActivityLogs,
  getSuspiciousActivity,
  runMonitoringScan,
  getMonitoringAlerts,
  updateMonitoringAlertStatus,
  getReportsSummary,
} from "../controllers/admin.controller.js";
import {
  getAllUsers,
  changeUserRole,
  toggleUserStatus,
  toggleUserRestriction,
} from "../controllers/user.controller.js";
import { getAllOrders } from "../controllers/order.controller.js";
import { getAllDisputes, resolveDispute } from "../controllers/dispute.controller.js";
import { verifyToken, authorizeRoles } from "../middleware/auth.middleware.js";

const router = Router();

// All admin routes require admin role
router.use(verifyToken, authorizeRoles("admin"));

router.get("/analytics", getAnalytics);
router.get("/users", getAllUsers);
router.patch("/users/:id/role", changeUserRole);
router.patch("/users/:id/status", toggleUserStatus);
router.put("/users/:id/toggle-status", toggleUserRestriction);
router.get("/orders", getAllOrders);
router.get("/flagged", getFlaggedContent);
router.patch("/flag/product/:id", flagProduct);
router.get("/activity", getActivityLogs);
router.get("/activity-logs", getActivityLogs);
router.get("/suspicious", getSuspiciousActivity);
router.post("/monitoring/scan", runMonitoringScan);
router.get("/monitoring/alerts", getMonitoringAlerts);
router.patch("/monitoring/alerts/:id", updateMonitoringAlertStatus);
router.get("/disputes", getAllDisputes);
router.patch("/disputes/:id/resolve", resolveDispute);

router.get("/reports-summary", getReportsSummary);

export default router;
