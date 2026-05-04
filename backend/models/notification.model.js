import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    type: {
      type: String,
      required: true,
      enum: [
        "message",
        "booking_request",
        "booking_approved",
        "booking_rejected",
        "booking_completed",
        "booking_cancelled",
        "order_placed",
        "order_status",
        "product_flagged",
        "product_unflagged",
      ],
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    link: { type: String, default: "" },
    isRead: { type: Boolean, default: false, index: true },
    entityId: { type: mongoose.Schema.Types.ObjectId, default: null },
    entityType: { type: String, default: "" },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
