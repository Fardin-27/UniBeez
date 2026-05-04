// Module 2: Skill-Based Service & Booking — developed by Member 3
import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema(
  {
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    description: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "tutoring",
        "technical_assistance",
        "creative_design",
        "campus_support",
        "fitness",
        "music",
        "language",
        "writing",
        "coding",
        "photography",
        "other",
      ],
    },
    pricingModel: {
      type: String,
      enum: ["hourly", "fixed"],
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    sessionType: {
      type: String,
      enum: ["online", "in-person"],
      default: "online",
      required: true,
    },
    meetingLink: {
      type: String,
      default: "",
      trim: true,
    },
    meetingLocation: {
      type: String,
      default: "",
      trim: true,
    },
    sessionDuration: {
      type: Number, // in minutes
      required: true,
    },
    skillTags: [
      {
        type: String,
        trim: true,
      },
    ],
    images: [
      {
        type: String,
      },
    ],
    ratingCount: {
      type: Number,
      default: 0,
    },
    totalRating: {
      type: Number,
      default: 0,
    },
    averageRating: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    completedBookings: {
      type: Number,
      default: 0,
    },
    responseTime: {
      type: Number, // in hours
      default: 24,
    },
  },
  { timestamps: true }
);

// Index for search
serviceSchema.index({ title: "text", description: "text", skillTags: "text" });
serviceSchema.index({ provider: 1 });
serviceSchema.index({ category: 1 });
serviceSchema.index({ isActive: 1 });

export default mongoose.model("Service", serviceSchema);
