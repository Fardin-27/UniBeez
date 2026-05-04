import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    action: {
      type: String,
      enum: [
        "create",
        "update",
        "delete",
        "product_listed",
        "product_purchased",
        "order_placed",
        "order_delivered",
        "order_cancelled",
        "profile_updated",
        "login",
      ],
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    details: {
      type: String,
    },
    entityType: {
      type: String,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

// Backward-compat mapping for mixed controller payloads.
activityLogSchema.pre("validate", function (next) {
  if (!this.user && this.userId) this.user = this.userId;
  if (!this.userId && this.user) this.userId = this.user;

  if (!this.description && this.details) this.description = this.details;
  if (!this.details && this.description) this.details = this.description;

  if (!this.relatedId && this.entityId) this.relatedId = this.entityId;
  if (!this.entityId && this.relatedId) this.entityId = this.relatedId;

  next();
});

activityLogSchema.index({ user: 1, createdAt: -1 });
activityLogSchema.index({ action: 1 });

const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);
export default ActivityLog;
