// Module 2: Skill-Based Service & Booking — developed by Member 3
import mongoose from "mongoose";

const serviceBookingSchema = new mongoose.Schema(
  {
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    bookingDate: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String, // HH:MM format
      required: true,
    },
    endTime: {
      type: String, // HH:MM format
      required: true,
    },
    status: {
      type: String,
      enum: ["requested", "approved", "rejected", "completed", "cancelled"],
      default: "requested",
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    notes: {
      type: String,
      maxlength: 1000,
      default: "",
    },
    providerNotes: {
      type: String,
      maxlength: 500,
      default: "",
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    review: {
      type: String,
      maxlength: 1000,
      default: "",
    },
    meetingLink: {
      type: String, // For online sessions
      default: "",
    },
    meetingLocation: {
      type: String, // For in-person sessions
      default: "",
    },
    sessionType: {
      type: String,
      enum: ["online", "in-person"],
      default: "online",
    },
    completedAt: {
      type: Date,
    },
    cancellationReason: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

serviceBookingSchema.index({ provider: 1, status: 1 });
serviceBookingSchema.index({ buyer: 1 });
serviceBookingSchema.index({ service: 1 });
serviceBookingSchema.index({ bookingDate: 1 });
serviceBookingSchema.index({ service: 1, buyer: 1, bookingDate: 1 });

export default mongoose.model("ServiceBooking", serviceBookingSchema);
