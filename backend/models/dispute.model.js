// Admin & Feedback module
import mongoose from "mongoose";

const disputeSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    againstUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    transactionType: {
      type: String,
      enum: ["order", "booking"],
      required: true,
    },
    complaintType: {
      type: String,
      enum: [
        "incomplete_service",
        "inaccurate_product_description",
        "delivery_failure",
        "payment_issue",
        "other",
      ],
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    evidenceUrls: [
      {
        type: String,
      },
    ],
    status: {
      type: String,
      enum: ["Submitted", "Under Review", "Resolved", "Rejected"],
      default: "Submitted",
    },
    adminResolution: {
      action: {
        type: String,
        enum: ["none", "warning", "refund", "account_restriction"],
        default: "none",
      },
      notes: {
        type: String,
        default: "",
      },
      refundAmount: {
        type: Number,
        min: 0,
        default: 0,
      },
      resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      resolvedAt: {
        type: Date,
        default: null,
      },
    },
  },
  { timestamps: true }
);

disputeSchema.index({ reporter: 1, createdAt: -1 });
disputeSchema.index({ againstUser: 1, createdAt: -1 });
disputeSchema.index({ status: 1, createdAt: -1 });
disputeSchema.index({ transactionType: 1 });

export default mongoose.model("Dispute", disputeSchema);
