import Service from "../models/service.model.js";
import ServiceBooking from "../models/serviceBooking.model.js";
import TimeSlot from "../models/timeSlot.model.js";
import ActivityLog from "../models/activityLog.model.js";
import Review from "../models/review.model.js";
import Conversation from "../models/conversation.model.js";
import { recalculateUserReputation } from "../lib/reputation.js";

const escapeRegex = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// GET /api/services - Get all services with filters
export const getServices = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 12,
      search,
      category,
      minPrice,
      maxPrice,
      sort = "newest",
    } = req.query;

    const query = { isActive: true };

    if (search) {
      const trimmedSearch = String(search).trim();
      const wordStartRegex = new RegExp(`\\b${escapeRegex(trimmedSearch)}`, "i");
      query.$or = [
        { title: { $regex: wordStartRegex } },
        { description: { $regex: wordStartRegex } },
        { category: { $regex: wordStartRegex } },
        { skillTags: { $regex: wordStartRegex } },
      ];
    }
    if (category) query.category = category;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    let sortOption = {};
    switch (sort) {
      case "price_asc":
        sortOption = { price: 1 };
        break;
      case "price_desc":
        sortOption = { price: -1 };
        break;
      case "rating":
        sortOption = { averageRating: -1 };
        break;
      case "newest":
      default:
        sortOption = { createdAt: -1 };
    }

    const skip = (page - 1) * limit;

    const [services, total] = await Promise.all([
      Service.find(query)
        .populate("provider", "fullName avatar reputationScore")
        .sort(sortOption)
        .skip(skip)
        .limit(parseInt(limit)),
      Service.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: services,
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

// GET /api/services/:id - Get service details
export const getServiceById = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id).populate(
      "provider",
      "fullName avatar reputationScore bio department university"
    );

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    const bookingCount = await ServiceBooking.countDocuments({
      service: service._id,
      status: "completed",
    });

    res.status(200).json({
      success: true,
      data: {
        ...service.toObject(),
        completedBookings: bookingCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/services - Create a new service
export const createService = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      pricingModel,
      price,
      sessionType,
      meetingLink,
      meetingLocation,
      sessionDuration,
      skillTags,
    } = req.body;

    if (
      !title ||
      !description ||
      !category ||
      !pricingModel ||
      !sessionType ||
      price === undefined ||
      !sessionDuration
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    if (!["online", "in-person"].includes(sessionType)) {
      return res.status(400).json({
        success: false,
        message: "Session type must be either online or in-person",
      });
    }

    if (sessionType === "online" && !meetingLink?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Meeting link is required for online services",
      });
    }

    if (sessionType === "in-person" && !meetingLocation?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Meeting location is required for in-person services",
      });
    }

    const images = req.files ? req.files.map((file) => file.path) : [];

    const service = new Service({
      provider: req.user._id,
      title,
      description,
      category,
      pricingModel,
      price: Number(price),
      sessionType,
      meetingLink: sessionType === "online" ? meetingLink.trim() : "",
      meetingLocation:
        sessionType === "in-person" ? meetingLocation.trim() : "",
      sessionDuration: Number(sessionDuration),
      skillTags: skillTags ? skillTags.split(",").map((tag) => tag.trim()) : [],
      images,
    });

    await service.save();

    // Log activity
    await ActivityLog.create({
      userId: req.user._id,
      action: "create",
      entityType: "service",
      entityId: service._id,
      details: `Created service: ${title}`,
    });

    res.status(201).json({
      success: true,
      message: "Service created successfully",
      data: service,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/services/:id - Update service
export const updateService = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      pricingModel,
      price,
      sessionType,
      meetingLink,
      meetingLocation,
      sessionDuration,
      skillTags,
      isActive,
    } =
      req.body;

    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    // Check if user is the provider
    if (service.provider.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this service",
      });
    }

    if (title) service.title = title;
    if (description) service.description = description;
    if (category) service.category = category;
    if (pricingModel) service.pricingModel = pricingModel;
    if (price !== undefined) service.price = Number(price);
    if (sessionType) {
      if (!["online", "in-person"].includes(sessionType)) {
        return res.status(400).json({
          success: false,
          message: "Session type must be either online or in-person",
        });
      }
      service.sessionType = sessionType;
    }

    const effectiveSessionType = sessionType || service.sessionType;

    if (effectiveSessionType === "online") {
      const effectiveMeetingLink =
        meetingLink !== undefined ? meetingLink : service.meetingLink;

      if (!effectiveMeetingLink || !effectiveMeetingLink.trim()) {
        return res.status(400).json({
          success: false,
          message: "Meeting link is required for online services",
        });
      }

      service.meetingLink = effectiveMeetingLink.trim();
      service.meetingLocation = "";
    }

    if (effectiveSessionType === "in-person") {
      const effectiveMeetingLocation =
        meetingLocation !== undefined
          ? meetingLocation
          : service.meetingLocation;

      if (!effectiveMeetingLocation || !effectiveMeetingLocation.trim()) {
        return res.status(400).json({
          success: false,
          message: "Meeting location is required for in-person services",
        });
      }

      service.meetingLocation = effectiveMeetingLocation.trim();
      service.meetingLink = "";
    }

    if (sessionDuration) service.sessionDuration = Number(sessionDuration);
    if (skillTags) {
      service.skillTags = skillTags
        .split(",")
        .map((tag) => tag.trim());
    }
    if (isActive !== undefined) service.isActive = isActive;

    if (req.files && req.files.length > 0) {
      service.images = req.files.map((file) => file.path);
    }

    await service.save();

    // Log activity
    await ActivityLog.create({
      userId: req.user._id,
      action: "update",
      entityType: "service",
      entityId: service._id,
      details: `Updated service: ${service.title}`,
    });

    res.status(200).json({
      success: true,
      message: "Service updated successfully",
      data: service,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/services/:id - Delete service
export const deleteService = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    // Check if user is the provider
    if (service.provider.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this service",
      });
    }

    // Cascade cleanup so service deletion succeeds even when related records exist.
    const bookings = await ServiceBooking.find({ service: service._id }).select("_id");
    const bookingIds = bookings.map((b) => b._id);

    await Promise.all([
      TimeSlot.deleteMany({ service: service._id }),
      Review.deleteMany({
        $or: [
          { service: service._id },
          { booking: { $in: bookingIds } },
        ],
      }),
      ServiceBooking.deleteMany({ service: service._id }),
      Conversation.deleteMany({ contextType: "service", service: service._id }),
      Service.findByIdAndDelete(req.params.id),
    ]);

    // Log activity
    await ActivityLog.create({
      userId: req.user._id,
      action: "delete",
      entityType: "service",
      entityId: service._id,
      details: `Deleted service: ${service.title}`,
    });

    res.status(200).json({
      success: true,
      message: "Service deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/services/my/listings - Get provider's services
export const getMyServices = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 12,
      search,
      category,
      minPrice,
      maxPrice,
      sort = "newest",
    } = req.query;
    const skip = (page - 1) * limit;

    const query = { provider: req.user.id };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }
    if (category) query.category = category;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    let sortOption = {};
    switch (sort) {
      case "price_asc":
        sortOption = { price: 1 };
        break;
      case "price_desc":
        sortOption = { price: -1 };
        break;
      case "rating":
        sortOption = { averageRating: -1 };
        break;
      case "newest":
      default:
        sortOption = { createdAt: -1 };
    }

    const [services, total] = await Promise.all([
      Service.find(query)
        .sort(sortOption)
        .skip(skip)
        .limit(parseInt(limit)),
      Service.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: services,
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

// PUT /api/services/:id/rating - Add/update rating
export const rateService = async (req, res, next) => {
  try {
    const { rating, review } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    const booking = await ServiceBooking.findOne({
      service: req.params.id,
      buyer: req.user.id,
      status: "completed",
    });

    if (!booking) {
      return res.status(400).json({
        success: false,
        message: "You can only rate completed services",
      });
    }

    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    // Update booking with rating for backward compatibility.
    booking.rating = rating;
    if (review) booking.review = review;
    await booking.save();

    await Review.findOneAndUpdate(
      {
        reviewer: req.user._id,
        transactionType: "booking",
        booking: booking._id,
      },
      {
        reviewer: req.user._id,
        reviewee: booking.provider,
        targetType: "service",
        transactionType: "booking",
        booking: booking._id,
        service: service._id,
        rating,
        ratingQuality: rating,
        ratingCommunication: rating,
        ratingTimeliness: rating,
        feedback: review || "",
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    const allRatings = await Review.find({ service: service._id }).select("rating");

    if (allRatings.length > 0) {
      const totalRating = allRatings.reduce((sum, b) => sum + b.rating, 0);
      service.ratingCount = allRatings.length;
      service.totalRating = totalRating;
      service.averageRating = totalRating / allRatings.length;
      await service.save();
    }

    await recalculateUserReputation(booking.provider);

    res.status(200).json({
      success: true,
      message: "Service rated successfully",
      data: {
        rating: service.averageRating,
        ratingCount: service.ratingCount,
      },
    });
  } catch (error) {
    next(error);
  }
};
