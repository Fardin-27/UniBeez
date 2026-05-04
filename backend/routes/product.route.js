import { Router } from "express";
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getMyProducts,
} from "../controllers/product.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";
import upload from "../config/multer.js";

const router = Router();

// Public routes
router.get("/", getProducts);

// All authenticated users can create and manage products
router.post("/", verifyToken, upload.array("images", 5), createProduct);

// Specific named routes (before generic /:id)
router.get("/my/listings", verifyToken, getMyProducts);

// Generic ID routes (must come last)
router.get("/:id", getProductById);
router.put("/:id", verifyToken, upload.array("images", 5), updateProduct);
router.delete("/:id", verifyToken, deleteProduct);

export default router;
