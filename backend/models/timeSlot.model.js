// Module 2: Skill-Based Service & Booking — developed by Member 3
import mongoose from "mongoose";

const timeSlotSchema = new mongoose.Schema(
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
    dayOfWeek: {
      type: Number, // 0-6 (Sunday-Saturday)
      required: true,
    },
    startTime: {
      type: String, // HH:MM format (24-hour)
      required: true,
    },
    endTime: {
      type: String, // HH:MM format (24-hour)
      required: true,
    },
    isRecurring: {
      type: Boolean,
      default: true,
    },
    specificDate: {
      type: Date, // For one-time slots
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    bookedSlots: [
      {
        bookingDate: {
          type: Date,
          required: true,
        },
        startTime: String,
        endTime: String,
        bookingId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "ServiceBooking",
        },
      },
    ],
  },
  { timestamps: true }
);

timeSlotSchema.index({ provider: 1, service: 1 });
timeSlotSchema.index({ isAvailable: 1 });

export default mongoose.model("TimeSlot", timeSlotSchema);
