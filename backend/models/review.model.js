// Admin & Feedback module
import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reviewee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    targetType: {
      type: String,
      enum: ["product", "service"],
      required: true,
    },
    transactionType: {
      type: String,
      enum: ["order", "booking"],
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceBooking",
      default: null,
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      default: null,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    ratingQuality: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    ratingCommunication: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    ratingTimeliness: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    feedback: {
      type: String,
      trim: true,
      maxlength: 1500,
      default: "",
    },
  },
  { timestamps: true }
);

reviewSchema.index({ reviewee: 1, createdAt: -1 });
reviewSchema.index({ reviewer: 1, createdAt: -1 });
reviewSchema.index({ service: 1, createdAt: -1 });
reviewSchema.index({ product: 1, createdAt: -1 });
reviewSchema.index(
  { reviewer: 1, transactionType: 1, order: 1 },
  {
    unique: true,
    partialFilterExpression: { transactionType: "order", order: { $type: "objectId" } },
  }
);
reviewSchema.index(
  { reviewer: 1, transactionType: 1, booking: 1 },
  {
    unique: true,
    partialFilterExpression: {
      transactionType: "booking",
      booking: { $type: "objectId" },
    },
  }
);

export default mongoose.model("Review", reviewSchema);
