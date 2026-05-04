// Admin & Feedback module
import mongoose from "mongoose";

const monitoringAlertSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    alertType: {
      type: String,
      enum: [
        "excessive_order_cancellations",
        "excessive_booking_cancellations",
        "high_listing_frequency",
        "high_dispute_ratio",
      ],
      required: true,
    },
    severity: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: ["open", "under_review", "resolved", "dismissed"],
      default: "open",
    },
  },
  { timestamps: true }
);

monitoringAlertSchema.index({ user: 1, createdAt: -1 });
monitoringAlertSchema.index({ alertType: 1, status: 1 });
monitoringAlertSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model("MonitoringAlert", monitoringAlertSchema);
