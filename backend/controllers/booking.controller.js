// Module 2: Skill-Based Service & Booking — developed by Member 3
import ServiceBooking from "../models/serviceBooking.model.js";
import Service from "../models/service.model.js";
import TimeSlot from "../models/timeSlot.model.js";
import ActivityLog from "../models/activityLog.model.js";
import { recalculateUserReputation } from "../lib/reputation.js";
import { createNotification } from "../lib/notify.js";

// POST /api/bookings - Create a booking request
export const createBooking = async (req, res, next) => {
  try {
    const {
      serviceId,
      bookingDate,
      startTime,
      endTime,
      notes,
    } = req.body;

    // Validate required fields
    if (!serviceId || !bookingDate || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // Get service details

        if (!isValidTime(startTime) || !isValidTime(endTime)) {
          return res.status(400).json({
            success: false,
            message: "Time must be in HH:MM format",
          });
        }

        const requestedDate = parseBookingDate(bookingDate);
        if (Number.isNaN(requestedDate.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid booking date",
          });
        }
        const { dayStart: requestedDayStart, dayEnd: requestedDayEnd } =
          getDayRange(requestedDate);

        if (!isTimeRangeValid(startTime, endTime)) {
          return res.status(400).json({
            success: false,
            message: "Start time must be before end time",
          });
        }
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    // Check if user is trying to book their own service
    const currentUserId = (req.user?._id || req.user?.id || "").toString();
    if (service.provider.toString() === currentUserId) {
      return res.status(400).json({
        success: false,
        message: "You cannot book your own service",
      });
    }

    // Prevent repeat bookings of the same service by the same user on the same day.
    const existingUserBooking = await ServiceBooking.findOne({
      service: serviceId,
      buyer: currentUserId,
      bookingDate: {
        $gte: requestedDayStart,
        $lte: requestedDayEnd,
      },
    }).select("_id");

    if (existingUserBooking) {
      return res.status(400).json({
        success: false,
        message: "You already booked this service for this date",
      });
    }

    // Check if slot is available
    const isSlotAvailable = await checkSlotAvailability(
      service.provider,
      serviceId,
      requestedDayStart,
      startTime,
      endTime
    );

    if (!isSlotAvailable) {
      return res.status(400).json({
        success: false,
        message: "Selected time slot is not available",
      });
    }

    // Calculate total price
    const [startHour, startMin] = startTime.split(":").map(Number);
    const [endHour, endMin] = endTime.split(":").map(Number);
    const durationMinutes = (endHour - startHour) * 60 + (endMin - startMin);
    const durationHours = durationMinutes / 60;

    let totalPrice = 0;
    if (service.pricingModel === "hourly") {
      totalPrice = service.price * durationHours;
    } else {
      totalPrice = service.price;
    }

    // Create booking document (save after reserving slot)
    const booking = new ServiceBooking({
      service: serviceId,
      provider: service.provider,
      buyer: req.user._id,
      bookingDate: requestedDayStart,
      startTime,
      endTime,
      totalPrice,
      notes,
      sessionType: service.sessionType || "online",
      meetingLink: service.sessionType === "online" ? service.meetingLink : "",
      meetingLocation:
        service.sessionType === "in-person" ? service.meetingLocation : "",
    });

    const reserved = await reserveTimeSlotForBooking(
      service.provider,
      serviceId,
      requestedDayStart,
      startTime,
      endTime,
      booking._id
    );

    if (!reserved) {
      return res.status(400).json({
        success: false,
        message: "Selected time slot is no longer available",
      });
    }

    try {
      await booking.save();
    } catch (saveError) {
      await releaseTimeSlotReservation(booking._id);

      if (saveError?.code === 11000) {
        return res.status(400).json({
          success: false,
          message: "You already booked this service for this date",
        });
      }

      throw saveError;
    }

    // Log activity
    await ActivityLog.create({
      userId: req.user._id,
      action: "create",
      entityType: "booking",
      entityId: booking._id,
      details: `Booked service: ${service.title}`,
    });

    // Notify the service provider
    await createNotification({
      recipient: service.provider,
      sender: req.user._id,
      type: "booking_request",
      title: "New Skill Request",
      body: `${req.user.fullName} has requested your service "${service.title}"`,
      link: "/service-bookings",
      entityId: booking._id,
      entityType: "booking",
    });

    res.status(201).json({
      success: true,
      message: "Booking request created successfully",
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/bookings - Get user's bookings
export const getMyBookings = async (req, res, next) => {
  try {
    const { role } = req.user;
    const { page = 1, limit = 10, status, view, serviceId, bookingDate } = req.query;
    const skip = (page - 1) * limit;

    let query = {};

    if (view === "provider") {
      query.provider = req.user._id;
    } else if (view === "buyer") {
      query.buyer = req.user._id;
    } else if (role === "seller" || role === "admin") {
      // Default provider view for seller/admin
      query.provider = req.user._id;
    } else {
      // Default buyer view
      query.buyer = req.user._id;
    }

    if (status) {
      query.status = status;
    }

    if (serviceId) {
      query.service = serviceId;
    }

    if (bookingDate) {
      const requestedDate = parseBookingDate(bookingDate);
      if (Number.isNaN(requestedDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid booking date",
        });
      }

      const { dayStart, dayEnd } = getDayRange(requestedDate);
      query.bookingDate = {
        $gte: dayStart,
        $lte: dayEnd,
      };
    }

    const [bookings, total] = await Promise.all([
      ServiceBooking.find(query)
        .populate("service", "title price pricingModel")
        .populate("buyer", "fullName avatar email")
        .populate("provider", "fullName avatar email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      ServiceBooking.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: bookings,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: parseInt(page),
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/bookings/:id - Get booking details
export const getBookingById = async (req, res, next) => {
  try {
    const booking = await ServiceBooking.findById(req.params.id)
      .populate("service")
      .populate("provider", "fullName avatar email phone bio")
      .populate("buyer", "fullName avatar email phone");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Check if user has access to this booking
    if (
      booking.provider._id.toString() !== req.user._id.toString() &&
      booking.buyer._id.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this booking",
      });
    }

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/bookings/:id/approve - Provider approves booking
export const approveBooking = async (req, res, next) => {
  try {
    const booking = await ServiceBooking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Check if user is the provider
    if (booking.provider.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to approve this booking",
      });
    }

    if (booking.status !== "requested") {
      return res.status(400).json({
        success: false,
        message: "Only requested bookings can be approved",
      });
    }

    booking.status = "approved";
    await booking.save();

    // Log activity
    await ActivityLog.create({
      userId: req.user._id,
      action: "update",
      entityType: "booking",
      entityId: booking._id,
      details: `Approved booking request`,
    });

    // Notify the buyer
    await createNotification({
      recipient: booking.buyer,
      sender: req.user._id,
      type: "booking_approved",
      title: "Booking Approved",
      body: "Your booking request has been approved by the provider.",
      link: "/my-bookings",
      entityId: booking._id,
      entityType: "booking",
    });

    res.status(200).json({
      success: true,
      message: "Booking approved successfully",
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/bookings/:id/reject - Provider rejects booking
export const rejectBooking = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const booking = await ServiceBooking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Check if user is the provider
    if (booking.provider.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to reject this booking",
      });
    }

    if (booking.status !== "requested") {
      return res.status(400).json({
        success: false,
        message: "Only requested bookings can be rejected",
      });
    }

    booking.status = "rejected";
    booking.cancellationReason = reason || "";
    await booking.save();
    await releaseTimeSlotReservation(booking._id);

    // Log activity
    await ActivityLog.create({
      userId: req.user._id,
      action: "update",
      entityType: "booking",
      entityId: booking._id,
      details: `Rejected booking request`,
    });

    // Notify the buyer
    await createNotification({
      recipient: booking.buyer,
      sender: req.user._id,
      type: "booking_rejected",
      title: "Booking Rejected",
      body: reason
        ? `Your booking was rejected: ${reason}`
        : "Your booking request has been rejected by the provider.",
      link: "/my-bookings",
      entityId: booking._id,
      entityType: "booking",
    });

    res.status(200).json({
      success: true,
      message: "Booking rejected successfully",
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/bookings/:id/complete - Mark booking as completed
export const completeBooking = async (req, res, next) => {
  try {
    const { providerNotes } = req.body;
    const booking = await ServiceBooking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Check if user is the provider
    if (booking.provider.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to complete this booking",
      });
    }

    if (booking.status !== "approved") {
      return res.status(400).json({
        success: false,
        message: "Only approved bookings can be marked as completed",
      });
    }

    booking.status = "completed";
    booking.completedAt = new Date();
    if (providerNotes) booking.providerNotes = providerNotes;
    await booking.save();

    // Update service completed bookings count
    const service = await Service.findById(booking.service);
    if (service) {
      service.completedBookings += 1;
      await service.save();
    }

    await recalculateUserReputation(booking.provider);

    // Log activity
    await ActivityLog.create({
      userId: req.user._id,
      action: "update",
      entityType: "booking",
      entityId: booking._id,
      details: `Completed booking`,
    });

    // Notify the buyer
    await createNotification({
      recipient: booking.buyer,
      sender: req.user._id,
      type: "booking_completed",
      title: "Booking Completed",
      body: "Your booking has been marked as completed. Feel free to leave a review!",
      link: "/my-bookings",
      entityId: booking._id,
      entityType: "booking",
    });

    res.status(200).json({
      success: true,
      message: "Booking marked as completed",
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/bookings/:id/cancel - Cancel booking
export const cancelBooking = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const booking = await ServiceBooking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Check if user has permission to cancel
    if (
      booking.buyer.toString() !== req.user.id &&
      booking.provider.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to cancel this booking",
      });
    }

    if (!["requested", "approved"].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: "Can only cancel requested or approved bookings",
      });
    }

    booking.status = "cancelled";
    booking.cancellationReason = reason || "";
    await booking.save();
    await releaseTimeSlotReservation(booking._id);

    // Log activity
    await ActivityLog.create({
      userId: req.user._id,
      action: "update",
      entityType: "booking",
      entityId: booking._id,
      details: `Cancelled booking`,
    });

    // Notify the other party
    const cancellerId = req.user._id.toString();
    const notifyUserId =
      booking.buyer.toString() === cancellerId ? booking.provider : booking.buyer;
    await createNotification({
      recipient: notifyUserId,
      sender: req.user._id,
      type: "booking_cancelled",
      title: "Booking Cancelled",
      body: reason
        ? `A booking was cancelled: ${reason}`
        : "A booking has been cancelled.",
      link: booking.buyer.toString() === cancellerId ? "/service-bookings" : "/my-bookings",
      entityId: booking._id,
      entityType: "booking",
    });

    res.status(200).json({
      success: true,
      message: "Booking cancelled successfully",
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to check slot availability
async function checkSlotAvailability(
  providerId,
  serviceId,
  bookingDate,
  startTime,
  endTime
) {
  try {
    const date = new Date(bookingDate);
    const dayOfWeek = date.getDay();

    // Check for overlapping existing bookings on the same date
    // A booking overlaps if: newStart < existingEnd AND newEnd > existingStart
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const existingBookings = await ServiceBooking.find({
      provider: providerId,
      bookingDate: {
        $gte: startDate,
        $lte: endDate,
      },
      status: { $in: ["requested", "approved"] },
    });

    // Check for time overlaps with existing bookings
    for (const booking of existingBookings) {
      // Convert times to comparable format (minutes since midnight)
      const [reqStartHour, reqStartMin] = startTime.split(":").map(Number);
      const [reqEndHour, reqEndMin] = endTime.split(":").map(Number);
      const [existingStartHour, existingStartMin] = booking.startTime.split(":").map(Number);
      const [existingEndHour, existingEndMin] = booking.endTime.split(":").map(Number);

      const reqStartMinutes = reqStartHour * 60 + reqStartMin;
      const reqEndMinutes = reqEndHour * 60 + reqEndMin;
      const existingStartMinutes = existingStartHour * 60 + existingStartMin;
      const existingEndMinutes = existingEndHour * 60 + existingEndMin;

      // Check if time ranges overlap
      if (reqStartMinutes < existingEndMinutes && reqEndMinutes > existingStartMinutes) {
        return false; // Overlapping booking exists
      }
    }

    // Check if provider has time slot available
    const timeSlot = await TimeSlot.findOne({
      provider: providerId,
      service: serviceId,
      dayOfWeek,
      isAvailable: true,
      startTime: { $lte: startTime },
      endTime: { $gte: endTime },
      $or: [
        { isRecurring: true },
        {
          isRecurring: false,
          specificDate: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      ],
    });

    if (!timeSlot) {
      return false;
    }

    // Check if requested time is within available slot
    const [slotStartHour, slotStartMin] = timeSlot.startTime.split(":").map(Number);
    const [slotEndHour, slotEndMin] = timeSlot.endTime.split(":").map(Number);
    const [reqStartHour, reqStartMin] = startTime.split(":").map(Number);
    const [reqEndHour, reqEndMin] = endTime.split(":").map(Number);

    const slotStartMinutes = slotStartHour * 60 + slotStartMin;
    const slotEndMinutes = slotEndHour * 60 + slotEndMin;
    const reqStartMinutes = reqStartHour * 60 + reqStartMin;
    const reqEndMinutes = reqEndHour * 60 + reqEndMin;

    return reqStartMinutes >= slotStartMinutes && reqEndMinutes <= slotEndMinutes;
  } catch (error) {
    console.error("Error checking slot availability:", error);
    return false;
  }
}

async function reserveTimeSlotForBooking(
  providerId,
  serviceId,
  bookingDate,
  startTime,
  endTime,
  bookingId
) {
  const dayStart = new Date(bookingDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(bookingDate);
  dayEnd.setHours(23, 59, 59, 999);

  const dayOfWeek = dayStart.getDay();

  // Atomically reserve a slot window if no overlapping reservation exists for this date.
  const reservedSlot = await TimeSlot.findOneAndUpdate(
    {
      provider: providerId,
      service: serviceId,
      dayOfWeek,
      isAvailable: true,
      startTime: { $lte: startTime },
      endTime: { $gte: endTime },
      $or: [
        { isRecurring: true },
        {
          isRecurring: false,
          specificDate: {
            $gte: dayStart,
            $lte: dayEnd,
          },
        },
      ],
      bookedSlots: {
        $not: {
          $elemMatch: {
            bookingDate: {
              $gte: dayStart,
              $lte: dayEnd,
            },
            startTime: { $lt: endTime },
            endTime: { $gt: startTime },
          },
        },
      },
    },
    {
      $push: {
        bookedSlots: {
          bookingDate: dayStart,
          startTime,
          endTime,
          bookingId,
        },
      },
    },
    { new: true }
  );

  return Boolean(reservedSlot);
}

async function releaseTimeSlotReservation(bookingId) {
  await TimeSlot.updateMany(
    { "bookedSlots.bookingId": bookingId },
    { $pull: { bookedSlots: { bookingId } } }
  );
}

function isValidTime(value) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function parseBookingDate(value) {
  if (typeof value === "string") {
    const dateOnlyMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dateOnlyMatch) {
      const [, year, month, day] = dateOnlyMatch;
      return new Date(Number(year), Number(month) - 1, Number(day));
    }
  }

  return new Date(value);
}

function getDayRange(dateValue) {
  const date = new Date(dateValue);
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);
  return { dayStart, dayEnd };
}

function timeToMinutes(value) {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

function isTimeRangeValid(startTime, endTime) {
  return timeToMinutes(startTime) < timeToMinutes(endTime);
}
export { checkSlotAvailability };
