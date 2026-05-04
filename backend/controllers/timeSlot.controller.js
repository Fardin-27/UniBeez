// Module 2: Skill-Based Service & Booking — developed by Member 3
import TimeSlot from "../models/timeSlot.model.js";
import Service from "../models/service.model.js";
import ActivityLog from "../models/activityLog.model.js";

// POST /api/timeslots - Create time slot
export const createTimeSlot = async (req, res, next) => {
  try {
    const {
      serviceId,
      dayOfWeek,
      startTime,
      endTime,
      isRecurring,
      specificDate,
    } = req.body;

    if (!serviceId || dayOfWeek === undefined || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    if (!isValidTime(startTime) || !isValidTime(endTime)) {
      return res.status(400).json({
        success: false,
        message: "Time must be in HH:MM format",
      });
    }

    // Verify service exists and user is the provider
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    if (service.provider.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to create time slots for this service",
      });
    }

    // Validate time format and day
    if (dayOfWeek < 0 || dayOfWeek > 6) {
      return res.status(400).json({
        success: false,
        message: "Day of week must be between 0 and 6",
      });
    }

    // Check if startTime < endTime
    if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
      return res.status(400).json({
        success: false,
        message: "Start time must be before end time",
      });
    }

    const hasOverlap = await hasOverlappingSlot({
      serviceId,
      dayOfWeek,
      startTime,
      endTime,
      isRecurring: isRecurring !== false,
      specificDate,
    });

    if (hasOverlap) {
      return res.status(400).json({
        success: false,
        message: "This time slot overlaps with an existing slot",
      });
    }

    const timeSlot = new TimeSlot({
      service: serviceId,
      provider: req.user._id,
      dayOfWeek,
      startTime,
      endTime,
      isRecurring: isRecurring !== false,
      specificDate:
        isRecurring === false && specificDate
          ? new Date(specificDate)
          : undefined,
    });

    await timeSlot.save();

    // Log activity
    await ActivityLog.create({
      userId: req.user._id,
      action: "create",
      entityType: "timeSlot",
      entityId: timeSlot._id,
      details: `Created time slot for service`,
    });

    res.status(201).json({
      success: true,
      message: "Time slot created successfully",
      data: timeSlot,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/timeslots/:serviceId - Get available time slots
export const getTimeSlots = async (req, res, next) => {
  try {
    const { serviceId } = req.params;
    const { date } = req.query; // Optional: filter by specific date

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    let query = {
      service: serviceId,
      isAvailable: true,
    };

    if (date) {
      const requestDate = new Date(date);
      const dayOfWeek = requestDate.getDay();
      query.dayOfWeek = dayOfWeek;

      // Also include specific date slots for this date
      query.$or = [
        { isRecurring: true },
        {
          isRecurring: false,
          specificDate: {
            $gte: new Date(requestDate.setHours(0, 0, 0, 0)),
            $lt: new Date(
              new Date(date).setHours(23, 59, 59, 999)
            ),
          },
        },
      ];
    }

    const timeSlots = await TimeSlot.find(query).sort({ startTime: 1 });

    let availableSlots = timeSlots;

    if (date) {
      const requestDate = new Date(date);
      const dayStart = new Date(requestDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(requestDate);
      dayEnd.setHours(23, 59, 59, 999);

      availableSlots = timeSlots.filter((slot) => {
        if (!slot.bookedSlots || slot.bookedSlots.length === 0) {
          return true;
        }

        return !slot.bookedSlots.some((booked) => {
          const bookedDate = new Date(booked.bookingDate);
          return bookedDate >= dayStart && bookedDate <= dayEnd;
        });
      });
    }

    res.status(200).json({
      success: true,
      data: availableSlots,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/timeslots/provider/my - Get provider's time slots
export const getMyTimeSlots = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, serviceId } = req.query;
    const skip = (page - 1) * limit;

    let query = { provider: req.user._id };
    if (serviceId) query.service = serviceId;

    const [timeSlots, total] = await Promise.all([
      TimeSlot.find(query)
        .populate("service", "title")
        .sort({ dayOfWeek: 1, startTime: 1 })
        .skip(skip)
        .limit(parseInt(limit)),
      TimeSlot.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: timeSlots,
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

// PUT /api/timeslots/:id - Update time slot
export const updateTimeSlot = async (req, res, next) => {
  try {
    const { dayOfWeek, startTime, endTime, isRecurring, specificDate, isAvailable } =
      req.body;

    const timeSlot = await TimeSlot.findById(req.params.id);

    if (!timeSlot) {
      return res.status(404).json({
        success: false,
        message: "Time slot not found",
      });
    }

    // Check authorization
    if (timeSlot.provider.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this time slot",
      });
    }

    if (dayOfWeek !== undefined) {
      if (dayOfWeek < 0 || dayOfWeek > 6) {
        return res.status(400).json({
          success: false,
          message: "Day of week must be between 0 and 6",
        });
      }
      timeSlot.dayOfWeek = dayOfWeek;
    }

    if (startTime && !isValidTime(startTime)) {
      return res.status(400).json({
        success: false,
        message: "Start time must be in HH:MM format",
      });
    }

    if (endTime && !isValidTime(endTime)) {
      return res.status(400).json({
        success: false,
        message: "End time must be in HH:MM format",
      });
    }

    if (startTime) timeSlot.startTime = startTime;
    if (endTime) timeSlot.endTime = endTime;
    if (isRecurring !== undefined) timeSlot.isRecurring = isRecurring;
    if (specificDate && timeSlot.isRecurring === false) {
      timeSlot.specificDate = new Date(specificDate);
    }
    if (isAvailable !== undefined) timeSlot.isAvailable = isAvailable;

    // Validate time
    if (timeToMinutes(timeSlot.startTime) >= timeToMinutes(timeSlot.endTime)) {
      return res.status(400).json({
        success: false,
        message: "Start time must be before end time",
      });
    }

    const hasOverlap = await hasOverlappingSlot({
      serviceId: timeSlot.service,
      dayOfWeek: timeSlot.dayOfWeek,
      startTime: timeSlot.startTime,
      endTime: timeSlot.endTime,
      isRecurring: timeSlot.isRecurring,
      specificDate: timeSlot.specificDate,
      excludeId: timeSlot._id,
    });

    if (hasOverlap) {
      return res.status(400).json({
        success: false,
        message: "Updated time slot overlaps with an existing slot",
      });
    }

    await timeSlot.save();

    // Log activity
    await ActivityLog.create({
      userId: req.user.id,
      action: "update",
      entityType: "timeSlot",
      entityId: timeSlot._id,
      details: `Updated time slot`,
    });

    res.status(200).json({
      success: true,
      message: "Time slot updated successfully",
      data: timeSlot,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/timeslots/:id - Delete time slot
export const deleteTimeSlot = async (req, res, next) => {
  try {
    const timeSlot = await TimeSlot.findById(req.params.id);

    if (!timeSlot) {
      return res.status(404).json({
        success: false,
        message: "Time slot not found",
      });
    }

    // Check authorization
    if (timeSlot.provider.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this time slot",
      });
    }

    // Check if slot has bookings
    if (timeSlot.bookedSlots && timeSlot.bookedSlots.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete time slot with active bookings",
      });
    }

    await TimeSlot.findByIdAndDelete(req.params.id);

    // Log activity
    await ActivityLog.create({
      userId: req.user.id,
      action: "delete",
      entityType: "timeSlot",
      entityId: req.params.id,
      details: `Deleted time slot`,
    });

    res.status(200).json({
      success: true,
      message: "Time slot deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

function isValidTime(value) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function timeToMinutes(value) {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

function getDayRange(dateValue) {
  const date = new Date(dateValue);
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);
  return { dayStart, dayEnd };
}

async function hasOverlappingSlot({
  serviceId,
  dayOfWeek,
  startTime,
  endTime,
  isRecurring,
  specificDate,
  excludeId,
}) {
  const query = {
    service: serviceId,
    dayOfWeek,
    startTime: { $lt: endTime },
    endTime: { $gt: startTime },
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  if (isRecurring) {
    query.$or = [{ isRecurring: true }];

    if (specificDate) {
      const { dayStart, dayEnd } = getDayRange(specificDate);
      query.$or.push({
        isRecurring: false,
        specificDate: { $gte: dayStart, $lte: dayEnd },
      });
    }
  } else {
    if (!specificDate) {
      return false;
    }

    const { dayStart, dayEnd } = getDayRange(specificDate);
    query.$or = [
      { isRecurring: true },
      {
        isRecurring: false,
        specificDate: { $gte: dayStart, $lte: dayEnd },
      },
    ];
  }

  const overlappingSlot = await TimeSlot.findOne(query);
  return Boolean(overlappingSlot);
}
