import Notification from "../models/notification.model.js";

/**
 * Creates a notification document. Fire-and-forget — errors are swallowed so
 * they never break the calling controller.
 */
export async function createNotification({
  recipient,
  sender = null,
  type,
  title,
  body,
  link = "",
  entityId = null,
  entityType = "",
}) {
  try {
    await Notification.create({ recipient, sender, type, title, body, link, entityId, entityType });
  } catch (err) {
    console.error("[notify] failed to create notification:", {
      message: err?.message,
      stack: err?.stack,
      recipient,
      sender,
      type,
      title,
      body,
      link,
      entityId,
      entityType,
    });
  }
}
