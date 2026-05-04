import mongoose from "mongoose";
import Conversation from "../models/conversation.model.js";
import Product from "../models/product.model.js";
import Service from "../models/service.model.js";
import ActivityLog from "../models/activityLog.model.js";
import { createNotification } from "../lib/notify.js";

const objectIdPattern = /^[a-fA-F0-9]{24}$/;

const normalizeObjectIdString = (value) =>
  typeof value === "string" ? value.trim() : "";

const isValidObjectIdString = (value) =>
  objectIdPattern.test(normalizeObjectIdString(value));

const idStringFromValue = (value) => {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value.toHexString === "function") return value.toHexString();
  if (value._id) return idStringFromValue(value._id);
  if (typeof value.toString === "function") {
    const stringValue = value.toString();
    return stringValue && stringValue !== "[object Object]" ? stringValue : null;
  }
  return null;
};

const toPlainObject = (value) =>
  value && typeof value.toObject === "function" ? value.toObject() : value;

const normalizeUserRefForResponse = (value) => {
  const plain = toPlainObject(value);
  const id = idStringFromValue(plain);
  if (!id) return null;

  if (!plain || typeof plain !== "object" || plain instanceof mongoose.Types.ObjectId) {
    return { _id: id };
  }

  return { ...plain, _id: id };
};

const participantIdFromParticipant = (participant) => {
  return idStringFromValue(participant);
};

const getOtherParticipant = (participants = [], currentUserId) => {
  const currentId = currentUserId?.toString();
  return participants.find(
    (participant) => participantIdFromParticipant(participant) !== currentId
  );
};

const senderIdFromMessage = (sender) => {
  return idStringFromValue(sender);
};

const normalizeMessageForResponse = (message) => {
  const plain = toPlainObject(message);
  return {
    ...plain,
    _id: idStringFromValue(plain._id),
    sender: normalizeUserRefForResponse(plain.sender) || { _id: "" },
    readBy: Array.isArray(plain.readBy)
      ? plain.readBy.map(idStringFromValue).filter(Boolean)
      : [],
  };
};

const normalizeConversationForResponse = (
  conversation,
  { currentUserId = null, includeMessages = true } = {}
) => {
  const plain = toPlainObject(conversation);
  const participants = Array.isArray(plain.participants)
    ? plain.participants.map(normalizeUserRefForResponse).filter(Boolean)
    : [];
  const normalized = {
    ...plain,
    _id: idStringFromValue(plain._id),
    participants,
    product: idStringFromValue(plain.product) || null,
    service: idStringFromValue(plain.service) || null,
  };

  if (currentUserId) {
    normalized.otherParticipant = getOtherParticipant(participants, currentUserId);
  }

  if (includeMessages) {
    normalized.messages = Array.isArray(plain.messages)
      ? plain.messages.map(normalizeMessageForResponse)
      : [];
  } else {
    delete normalized.messages;
  }

  return normalized;
};

const validateConversationId = (conversationId, res) => {
  const normalized = normalizeObjectIdString(conversationId);
  if (!isValidObjectIdString(normalized)) {
    res.status(400).json({ success: false, message: "Invalid conversation id" });
    return null;
  }

  return normalized;
};

const validateMessageId = (messageId, res) => {
  const normalized = normalizeObjectIdString(messageId);
  if (!isValidObjectIdString(normalized)) {
    res.status(400).json({ success: false, message: "Invalid message id" });
    return null;
  }

  return normalized;
};

const buildConversationQuery = ({ userId, contextType, productId, serviceId }) => {
  const query = { participants: userId };
  if (contextType) query.contextType = contextType;
  if (productId) query.product = productId;
  if (serviceId) query.service = serviceId;
  return query;
};

// POST /api/messages/conversations
export const createOrOpenConversation = async (req, res, next) => {
  try {
    const {
      participantId,
      contextType = "general",
      productId,
      serviceId,
      message,
    } = req.body;

    const participantIdNormalized = participantId ? String(participantId).trim() : "";
    const productIdNormalized = productId ? String(productId).trim() : "";
    const serviceIdNormalized = serviceId ? String(serviceId).trim() : "";
    const currentUserId = req.user._id.toString();

    if (!participantIdNormalized || !message?.trim()) {
      return res.status(400).json({
        success: false,
        message: "participantId and message are required",
      });
    }

    if (!isValidObjectIdString(participantIdNormalized)) {
      return res.status(400).json({ success: false, message: "participantId must be a valid id" });
    }

    if (participantIdNormalized === currentUserId) {
      return res.status(400).json({
        success: false,
        message: "You cannot message yourself",
      });
    }

    if (contextType === "product" && !productIdNormalized) {
      return res.status(400).json({
        success: false,
        message: "productId is required for product conversations",
      });
    }

    if (productIdNormalized && !isValidObjectIdString(productIdNormalized)) {
      return res.status(400).json({ success: false, message: "productId must be a valid id" });
    }

    if (contextType === "service" && !serviceIdNormalized) {
      return res.status(400).json({
        success: false,
        message: "serviceId is required for service conversations",
      });
    }

    if (serviceIdNormalized && !isValidObjectIdString(serviceIdNormalized)) {
      return res.status(400).json({ success: false, message: "serviceId must be a valid id" });
    }

    // Enforce that context-bound chats can only target the related owner profile.
    if (contextType === "product") {
      const product = await Product.findById(productIdNormalized).select("_id seller");
      if (!product) {
        return res.status(404).json({ success: false, message: "Product not found" });
      }

      if (product.seller.toString() !== participantIdNormalized) {
        return res.status(403).json({
          success: false,
          message: "For product chats, participant must be the product seller",
        });
      }
    }

    if (contextType === "service") {
      const service = await Service.findById(serviceIdNormalized).select("_id provider");
      if (!service) {
        return res.status(404).json({ success: false, message: "Service not found" });
      }

      if (service.provider.toString() !== participantIdNormalized) {
        return res.status(403).json({
          success: false,
          message: "For service chats, participant must be the service provider",
        });
      }
    }

    const participantIds = [currentUserId, participantIdNormalized].sort();
    const messagePayload = {
      sender: req.user._id,
      body: message.trim(),
      readBy: [req.user._id],
    };

    let conversation = await Conversation.findOne({
      participants: { $all: participantIds },
      contextType,
      product: productIdNormalized || null,
      service: serviceIdNormalized || null,
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: participantIds,
        createdBy: req.user._id,
        contextType,
        product: productIdNormalized || null,
        service: serviceIdNormalized || null,
        messages: [messagePayload],
        lastMessageAt: new Date(),
      });
    } else {
      conversation.messages.push(messagePayload);
      conversation.lastMessageAt = new Date();
      await conversation.save();
    }

    const populatedConversation = await Conversation.findById(conversation._id)
      .populate("participants", "username fullName avatar");

    // Notify the recipient of the initial message
    await createNotification({
      recipient: participantIdNormalized,
      sender: req.user._id,
      type: "message",
      title: "New Message",
      body: `${req.user.fullName}: ${message.trim().slice(0, 80)}${message.trim().length > 80 ? "…" : ""}`,
      link: "/messages",
      entityId: conversation._id,
      entityType: "conversation",
    });

    await ActivityLog.create({
      user: req.user._id,
      action: "create",
      description: "Started/updated conversation",
      entityType: "conversation",
      entityId: populatedConversation._id,
      metadata: {
        contextType,
        participantId: participantIdNormalized,
      },
    });

    res.status(201).json({ 
      success: true, 
      conversation: normalizeConversationForResponse(populatedConversation),
      _debug: "local-backend-v2" 
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/messages/conversations
export const getMyConversations = async (req, res, next) => {
  try {
    const { contextType, productId, serviceId } = req.query;
    const productIdNormalized = productId ? String(productId).trim() : "";
    const serviceIdNormalized = serviceId ? String(serviceId).trim() : "";

    if (productIdNormalized && !isValidObjectIdString(productIdNormalized)) {
      return res.status(400).json({ success: false, message: "productId must be a valid id" });
    }

    if (serviceIdNormalized && !isValidObjectIdString(serviceIdNormalized)) {
      return res.status(400).json({ success: false, message: "serviceId must be a valid id" });
    }

    const query = buildConversationQuery({
      userId: req.user._id,
      contextType,
      productId: productIdNormalized,
      serviceId: serviceIdNormalized,
    });

    const conversations = await Conversation.find(query)
      .populate("participants", "username fullName avatar")
      .sort({ lastMessageAt: -1 });

    console.log("[getMyConversations] found raw conversations:", conversations.length);
    conversations.forEach(c => {
      console.log("  - conversation _id:", c._id.toString(), "participants:", c.participants.map(p => p._id ? p._id.toString() : p.toString()));
    });

    const normalized = conversations.map((conversation) => {
      const latest = conversation.messages[conversation.messages.length - 1] || null;
      const unreadCount = conversation.messages.filter((message) => {
        const senderId = senderIdFromMessage(message.sender);
        return (
          senderId !== req.user._id.toString() &&
          !message.readBy.some((reader) => reader.toString() === req.user._id.toString())
        );
      }).length;
      const normalizedConversation = normalizeConversationForResponse(conversation, {
        currentUserId: req.user._id,
        includeMessages: false,
      });

      return {
        ...normalizedConversation,
        latestMessage: latest ? normalizeMessageForResponse(latest) : null,
        unreadCount,
      };
    });

    console.log("[getMyConversations] returning normalized list with IDs:", normalized.map(c => c._id));
    console.log("GET /api/messages/conversations ->", {
      user: req.user._id.toString(),
      count: normalized.length,
      query,
    });

    res.json({ success: true, conversations: normalized, _debug: "local-backend-v4" });
  } catch (error) {
    next(error);
  }
};

// GET /api/messages/conversations/:id/messages
export const getConversationMessages = async (req, res, next) => {
  try {
    const conversationId = validateConversationId(req.params.id, res);
    if (!conversationId) return;

    console.log("GET /api/messages/conversations/:id/messages -> requested", { id: conversationId, user: req.user?._id?.toString() });

    const conversation = await Conversation.findById(conversationId)
      .populate("participants", "username fullName avatar");

    if (!conversation) {
      return res.status(404).json({ success: false, message: "Conversation not found" });
    }

    if (!conversation.participants.some((participant) => participantIdFromParticipant(participant) === req.user._id.toString())) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    // Mark unread messages as read for this user.
    let updated = false;
    for (const message of conversation.messages) {
      const hasRead = message.readBy.some(
        (reader) => reader.toString() === req.user._id.toString()
      );

      const senderId = senderIdFromMessage(message.sender);
      if (senderId !== req.user._id.toString() && !hasRead) {
        message.readBy.push(req.user._id);
        updated = true;
      }
    }

    if (updated) {
      await conversation.save();
    }

    console.log("GET conversation messages OK ->", { id: conversation._id.toString(), participants: conversation.participants.map(p => p._id ? p._id.toString() : p.toString()) });
    try {
      const msgs = conversation.messages || [];
      console.log("Conversation messages count:", msgs.length);
      console.log(
        "Sample messages:",
        msgs.slice(-5).map((m) => ({ id: m._id ? m._id.toString() : null, bodyPreview: (m.body || "").slice(0, 80), deleted: !!m.deleted }))
      );
    } catch (e) {
      console.log("Failed to log messages sample", e?.message || e);
    }

    res.json({
      success: true,
      conversation: normalizeConversationForResponse(conversation),
      _debug: "local-backend-v4",
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/messages/conversations/:id/messages
export const sendMessage = async (req, res, next) => {
  try {
    const { body } = req.body;
    if (!body?.trim()) {
      return res.status(400).json({ success: false, message: "Message body is required" });
    }

    const conversationId = validateConversationId(req.params.id, res);
    if (!conversationId) return;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: "Conversation not found" });
    }

    if (!conversation.participants.some((id) => id.toString() === req.user._id.toString())) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    const participantIds = conversation.participants.map((id) => id.toString());
    const uniqueParticipants = [...new Set(participantIds)];
    if (uniqueParticipants.length < 2) {
      return res.status(400).json({
        success: false,
        message: "You cannot message yourself",
      });
    }

    conversation.messages.push({
      sender: req.user._id,
      body: body.trim(),
      readBy: [req.user._id],
    });
    conversation.lastMessageAt = new Date();
    await conversation.save();

    // Notify the other participant
    const recipientId = conversation.participants.find(
      (id) => id.toString() !== req.user._id.toString()
    );
    if (recipientId) {
      await createNotification({
        recipient: recipientId,
        sender: req.user._id,
        type: "message",
        title: "New Message",
        body: `${req.user.fullName}: ${body.trim().slice(0, 80)}${body.trim().length > 80 ? "…" : ""}`,
        link: "/messages",
        entityId: conversation._id,
        entityType: "conversation",
      });
    }

    const populated = await Conversation.findById(conversation._id)
      .populate("participants", "username fullName avatar");

    res.status(201).json({
      success: true,
      conversation: normalizeConversationForResponse(populated),
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/messages/conversations/:id/messages/:messageId
export const editMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const { body } = req.body;

    if (!body?.trim()) {
      return res.status(400).json({ success: false, message: "Message body is required" });
    }

    const conversationId = validateConversationId(req.params.id, res);
    const validMessageId = validateMessageId(messageId, res);
    if (!conversationId || !validMessageId) return;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ success: false, message: "Conversation not found" });

    const message = conversation.messages.id(validMessageId);
    if (!message) return res.status(404).json({ success: false, message: "Message not found" });

    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to edit this message" });
    }

    if (message.deleted) {
      return res.status(400).json({ success: false, message: "Cannot edit a deleted message" });
    }

    message.body = body.trim();
    message.edited = true;
    conversation.lastMessageAt = new Date();
    await conversation.save();

    const populated = await Conversation.findById(conversation._id)
      .populate("participants", "username fullName avatar");

    res.json({
      success: true,
      conversation: normalizeConversationForResponse(populated),
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/messages/conversations/:id/messages/:messageId
export const deleteMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;

    const conversationId = validateConversationId(req.params.id, res);
    const validMessageId = validateMessageId(messageId, res);
    if (!conversationId || !validMessageId) return;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return res.status(404).json({ success: false, message: "Conversation not found" });

    const message = conversation.messages.id(validMessageId);
    if (!message) return res.status(404).json({ success: false, message: "Message not found" });

    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to delete this message" });
    }

    // Soft delete
    message.deleted = true;
    message.body = "Message deleted";
    message.edited = false;
    conversation.lastMessageAt = new Date();
    await conversation.save();

    const populated = await Conversation.findById(conversation._id)
      .populate("participants", "username fullName avatar");

    res.json({
      success: true,
      conversation: normalizeConversationForResponse(populated),
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/messages/conversations/:id
export const deleteConversation = async (req, res, next) => {
  try {
    const conversationId = validateConversationId(req.params.id, res);
    if (!conversationId) return;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: "Conversation not found" });
    }

    if (!conversation.participants.some((id) => id.toString() === req.user._id.toString())) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    await Conversation.findByIdAndDelete(conversation._id);

    await ActivityLog.create({
      user: req.user._id,
      action: "delete",
      description: "Deleted conversation",
      entityType: "conversation",
      entityId: conversation._id,
      metadata: {
        contextType: conversation.contextType,
      },
    });

    res.json({ success: true, message: "Conversation deleted", conversationId });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/messages/conversations/:id/read
export const markConversationAsRead = async (req, res, next) => {
  try {
    const conversationId = validateConversationId(req.params.id, res);
    if (!conversationId) return;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: "Conversation not found" });
    }

    if (!conversation.participants.some((id) => id.toString() === req.user._id.toString())) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    for (const message of conversation.messages) {
      const hasRead = message.readBy.some(
        (reader) => reader.toString() === req.user._id.toString()
      );

      if (!hasRead) {
        message.readBy.push(req.user._id);
      }
    }

    await conversation.save();
    res.json({ success: true, message: "Conversation marked as read" });
  } catch (error) {
    next(error);
  }
};
