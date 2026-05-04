import { Router } from "express";
import {
  createOrder,
  getMyOrders,
  getSellerOrders,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
} from "../controllers/order.controller.js";
import { verifyToken, authorizeRoles } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/", verifyToken, createOrder);
router.get("/my", verifyToken, getMyOrders);
router.get("/seller", verifyToken, getSellerOrders);
router.get("/all", verifyToken, authorizeRoles("admin"), getAllOrders);
router.get("/:id", verifyToken, getOrderById);
router.patch("/:id/status", verifyToken, updateOrderStatus);

export default router;
