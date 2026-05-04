// Admin & Feedback module
import Review from "../models/review.model.js";
import Order from "../models/order.model.js";
import ServiceBooking from "../models/serviceBooking.model.js";
import Service from "../models/service.model.js";
import ActivityLog from "../models/activityLog.model.js";
import { recalculateUserReputation } from "../lib/reputation.js";

const validateRating = (value) => Number.isFinite(value) && value >= 1 && value <= 5;

const normalizeRatings = ({
  rating,
  ratingQuality,
  ratingCommunication,
  ratingTimeliness,
}) => {
  const overall = Number(rating);
  const quality = Number(ratingQuality ?? rating);
  const communication = Number(ratingCommunication ?? rating);
  const timeliness = Number(ratingTimeliness ?? rating);

  if (
    !validateRating(overall) ||
    !validateRating(quality) ||
    !validateRating(communication) ||
    !validateRating(timeliness)
  ) {
    return null;
  }

  return {
    rating: overall,
    ratingQuality: quality,
    ratingCommunication: communication,
    ratingTimeliness: timeliness,
  };
};

const recomputeServiceRating = async (serviceId) => {
  const ratings = await Review.find({
    targetType: "service",
    service: serviceId,
  }).select("rating");

  const total = ratings.reduce((sum, item) => sum + item.rating, 0);
  const count = ratings.length;

  await Service.findByIdAndUpdate(serviceId, {
    ratingCount: count,
    totalRating: total,
    averageRating: count > 0 ? total / count : 0,
  });
};

// POST /api/feedback/orders/:orderId
export const submitOrderFeedback = async (req, res, next) => {
  try {
    const parsedRatings = normalizeRatings(req.body);
    if (!parsedRatings) {
      return res.status(400).json({
        success: false,
        message: "Ratings must be between 1 and 5",
      });
    }

    const { feedback = "" } = req.body;

    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.buyer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    if (order.status !== "delivered") {
      return res.status(400).json({
        success: false,
        message: "Feedback can only be submitted for delivered orders",
      });
    }

    const review = await Review.findOneAndUpdate(
      {
        reviewer: req.user._id,
        transactionType: "order",
        order: order._id,
      },
      {
        reviewer: req.user._id,
        reviewee: order.seller,
        targetType: "product",
        transactionType: "order",
        order: order._id,
        product: order.items?.length === 1 ? order.items[0].product : null,
        rating: parsedRatings.rating,
        ratingQuality: parsedRatings.ratingQuality,
        ratingCommunication: parsedRatings.ratingCommunication,
        ratingTimeliness: parsedRatings.ratingTimeliness,
        feedback,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    const reputation = await recalculateUserReputation(order.seller);

    await ActivityLog.create({
      user: req.user._id,
      action: "update",
      description: `Submitted order feedback for order #${order._id}`,
      entityType: "order",
      entityId: order._id,
      metadata: {
        reviewId: review._id,
        rating: parsedRatings.rating,
      },
    });

    res.status(200).json({
      success: true,
      message: "Order feedback submitted",
      review,
      reputation,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/feedback/bookings/:bookingId
export const submitBookingFeedback = async (req, res, next) => {
  try {
    const parsedRatings = normalizeRatings(req.body);
    if (!parsedRatings) {
      return res.status(400).json({
        success: false,
        message: "Ratings must be between 1 and 5",
      });
    }

    const { feedback = "" } = req.body;

    const booking = await ServiceBooking.findById(req.params.bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    if (booking.buyer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    if (booking.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Feedback can only be submitted for completed bookings",
      });
    }

    const review = await Review.findOneAndUpdate(
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
        service: booking.service,
        rating: parsedRatings.rating,
        ratingQuality: parsedRatings.ratingQuality,
        ratingCommunication: parsedRatings.ratingCommunication,
        ratingTimeliness: parsedRatings.ratingTimeliness,
        feedback,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    booking.rating = parsedRatings.rating;
    booking.review = feedback;
    await booking.save();

    await Promise.all([
      recomputeServiceRating(booking.service),
      recalculateUserReputation(booking.provider),
    ]);

    await ActivityLog.create({
      user: req.user._id,
      action: "update",
      description: `Submitted booking feedback for booking #${booking._id}`,
      entityType: "booking",
      entityId: booking._id,
      metadata: {
        reviewId: review._id,
        rating: parsedRatings.rating,
      },
    });

    res.status(200).json({
      success: true,
      message: "Booking feedback submitted",
      review,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/feedback/received
export const getReceivedFeedback = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      targetType,
      minRating,
      startDate,
      endDate,
    } = req.query;

    const query = { reviewee: req.user._id };
    if (targetType) query.targetType = targetType;
    if (minRating) query.rating = { $gte: Number(minRating) };
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const [reviews, total] = await Promise.all([
      Review.find(query)
        .populate("reviewer", "username fullName avatar")
        .populate("order", "status totalAmount")
        .populate("booking", "status totalPrice")
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit)),
      Review.countDocuments(query),
    ]);

    res.json({
      success: true,
      reviews,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/feedback/given
export const getGivenFeedback = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, targetType } = req.query;
    const query = { reviewer: req.user._id };
    if (targetType) query.targetType = targetType;

    const [reviews, total] = await Promise.all([
      Review.find(query)
        .populate("reviewee", "username fullName avatar reputationScore")
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit)),
      Review.countDocuments(query),
    ]);

    res.json({
      success: true,
      reviews,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/feedback/public
export const getPublicFeedback = async (req, res, next) => {
  try {
    const {
      serviceId,
      productId,
      revieweeId,
      page = 1,
      limit = 20,
    } = req.query;

    const query = {};
    if (serviceId) query.service = serviceId;
    if (productId) query.product = productId;
    if (revieweeId) query.reviewee = revieweeId;

    const [reviews, total] = await Promise.all([
      Review.find(query)
        .populate("reviewer", "fullName avatar")
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit)),
      Review.countDocuments(query),
    ]);

    res.json({
      success: true,
      reviews,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};
