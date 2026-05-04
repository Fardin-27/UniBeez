// Product & Transaction module
import { Router } from "express";
import {
  getCart,
  addToCart,
  removeFromCart,
  updateCartQuantity,
  clearCart,
} from "../controllers/cart.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", verifyToken, getCart);
router.post("/add", verifyToken, addToCart);
router.delete("/remove/:productId", verifyToken, removeFromCart);
router.patch("/update/:productId", verifyToken, updateCartQuantity);
router.delete("/clear", verifyToken, clearCart);

export default router;
