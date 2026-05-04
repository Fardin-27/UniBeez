import { Router } from "express";
import {
  createOrOpenConversation,
  getMyConversations,
  getConversationMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  deleteConversation,
  markConversationAsRead,
} from "../controllers/messaging.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = Router();

router.use(verifyToken);

router.post("/conversations", createOrOpenConversation);
router.get("/conversations", getMyConversations);
router.delete("/conversations/:id", deleteConversation);
router.get("/conversations/:id/messages", getConversationMessages);
router.post("/conversations/:id/messages", sendMessage);
router.patch("/conversations/:id/messages/:messageId", editMessage);
router.delete("/conversations/:id/messages/:messageId", deleteMessage);
router.patch("/conversations/:id/read", markConversationAsRead);

export default router;
