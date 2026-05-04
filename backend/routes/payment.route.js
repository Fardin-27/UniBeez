import { Router } from "express";
import {
  initPayment,
  paymentSuccess,
  paymentFail,
  paymentCancel,
} from "../controllers/payment.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/init", verifyToken, initPayment);
router.post("/success", paymentSuccess);
router.post("/fail", paymentFail);
router.post("/cancel", paymentCancel);

export default router;
