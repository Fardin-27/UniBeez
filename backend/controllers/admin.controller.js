import User from "../models/user.model.js";
import Product from "../models/product.model.js";
import Order from "../models/order.model.js";
import Service from "../models/service.model.js";
import ServiceBooking from "../models/serviceBooking.model.js";
import Dispute from "../models/dispute.model.js";
import Review from "../models/review.model.js";
import MonitoringAlert from "../models/monitoringAlert.model.js";
import ActivityLog from "../models/activityLog.model.js";
import { createNotification } from "../lib/notify.js";

const getDateRangeForDays = (days) => {
  const from = new Date();
  from.setDate(from.getDate() - days);
  return from;
};

const classifySeverity = (count, highThreshold, mediumThreshold) => {
  if (count >= highThreshold) return "high";
  if (count >= mediumThreshold) return "medium";
  return "low";
};

const monitoringStatusMap = {
  open: "open",
  "under review": "under_review",
  under_review: "under_review",
  resolved: "resolved",
  resolve: "resolved",
  dismissed: "dismissed",
  dismiss: "dismissed",
};

const normalizeMonitoringStatus = (status) => {
  if (typeof status !== "string") return "";
  return monitoringStatusMap[status.trim().toLowerCase()] || "";
};

const createAlert = async ({ user, alertType, description, severity, metadata = {} }) => {
  const sevenDaysAgo = getDateRangeForDays(7);

  const existing = await MonitoringAlert.findOne({
    user,
    alertType,
    status: { $in: ["open", "under_review"] },
    createdAt: { $gte: sevenDaysAgo },
  });

  if (existing) return existing;

  return MonitoringAlert.create({
    user,
    alertType,
    description,
    severity,
    metadata,
    status: "open",
  });
};

const runMonitoringDetection = async () => {
  const sevenDaysAgo = getDateRangeForDays(7);
  const oneDayAgo = getDateRangeForDays(1);
  const generatedAlerts = [];

  const [orderCancellers, bookingCancellers, highDisputeRatioUsers] =
    await Promise.all([
      Order.aggregate([
        { $match: { status: "cancelled", updatedAt: { $gte: sevenDaysAgo } } },
        { $group: { _id: "$buyer", count: { $sum: 1 } } },
        { $match: { count: { $gte: 3 } } },
      ]),
      ServiceBooking.aggregate([
        { $match: { status: "cancelled", updatedAt: { $gte: sevenDaysAgo } } },
        { $group: { _id: "$buyer", count: { $sum: 1 } } },
        { $match: { count: { $gte: 3 } } },
      ]),
      Dispute.aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo } } },
        { $group: { _id: "$againstUser", count: { $sum: 1 } } },
        { $match: { count: { $gte: 3 } } },
      ]),
    ]);

  for (const item of orderCancellers) {
    const alert = await createAlert({
      user: item._id,
      alertType: "excessive_order_cancellations",
      description: `User has ${item.count} order cancellations in the last 7 days`,
      severity: classifySeverity(item.count, 7, 4),
      metadata: { cancellations: item.count, windowDays: 7 },
    });
    generatedAlerts.push(alert);
  }

  for (const item of bookingCancellers) {
    const alert = await createAlert({
      user: item._id,
      alertType: "excessive_booking_cancellations",
      description: `User has ${item.count} booking cancellations in the last 7 days`,
      severity: classifySeverity(item.count, 7, 4),
      metadata: { cancellations: item.count, windowDays: 7 },
    });
    generatedAlerts.push(alert);
  }

  for (const item of highDisputeRatioUsers) {
    const alert = await createAlert({
      user: item._id,
      alertType: "high_dispute_ratio",
      description: `User was reported in ${item.count} disputes in the last 7 days`,
      severity: classifySeverity(item.count, 8, 4),
      metadata: { disputes: item.count, windowDays: 7 },
    });
    generatedAlerts.push(alert);
  }

  return generatedAlerts;
};

// GET /api/admin/analytics
export const getAnalytics = async (req, res, next) => {
  try {
    const thirtyDaysAgo = getDateRangeForDays(30);

    const [totalUsers, totalProducts, totalServices, totalOrders, totalBookings] =
      await Promise.all([
        User.countDocuments(),
        Product.countDocuments(),
        Service.countDocuments(),
        Order.countDocuments(),
        ServiceBooking.countDocuments(),
      ]);

    const recentOrders = await Order.find({ createdAt: { $gte: thirtyDaysAgo } }).select(
      "createdAt totalAmount status"
    );
    const orderVolume = recentOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    const recentBookings = await ServiceBooking.find({
      createdAt: { $gte: thirtyDaysAgo },
    }).select("createdAt totalPrice status");
    const bookingVolume = recentBookings.reduce((sum, b) => sum + b.totalPrice, 0);

    const productCategoryActivity = await Product.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const serviceCategoryActivity = await Service.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const categoryActivity = {
      products: productCategoryActivity,
      services: serviceCategoryActivity,
    };

    const topSellers = await Order.aggregate([
      { $match: { status: "delivered" } },
      { $group: { _id: "$seller", totalSales: { $sum: "$totalAmount" }, orderCount: { $sum: 1 } } },
      { $sort: { totalSales: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "seller",
        },
      },
      { $unwind: "$seller" },
      {
        $project: {
          _id: 1,
          totalSales: 1,
          orderCount: 1,
          "seller.username": 1,
          "seller.fullName": 1,
        },
      },
    ]);

    const topProviders = await ServiceBooking.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: "$provider", totalRevenue: { $sum: "$totalPrice" }, bookingCount: { $sum: 1 } } },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "provider",
        },
      },
      { $unwind: "$provider" },
      {
        $project: {
          _id: 1,
          totalRevenue: 1,
          bookingCount: 1,
          "provider.username": 1,
          "provider.fullName": 1,
        },
      },
    ]);

    const serviceBookingTrends = await ServiceBooking.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: {
            day: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            status: "$status",
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.day": 1 } },
    ]);

    const revenueFlow = await Order.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo }, status: { $in: ["paid", "confirmed", "delivered"] } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          orderRevenue: { $sum: "$totalAmount" },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const bookingRevenueFlow = await ServiceBooking.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo }, status: { $in: ["approved", "completed"] } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          bookingRevenue: { $sum: "$totalPrice" },
          bookingCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const sellerPerformance = await Review.aggregate([
      { $match: { targetType: "product" } },
      {
        $group: {
          _id: "$reviewee",
          avgRating: { $avg: "$rating" },
          reviewCount: { $sum: 1 },
        },
      },
      { $sort: { avgRating: -1, reviewCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          _id: 1,
          avgRating: 1,
          reviewCount: 1,
          "user.fullName": 1,
          "user.username": 1,
          "user.reputationScore": 1,
        },
      },
    ]);

    const providerPerformance = await Review.aggregate([
      { $match: { targetType: "service" } },
      {
        $group: {
          _id: "$reviewee",
          avgRating: { $avg: "$rating" },
          reviewCount: { $sum: 1 },
        },
      },
      { $sort: { avgRating: -1, reviewCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          _id: 1,
          avgRating: 1,
          reviewCount: 1,
          "user.fullName": 1,
          "user.username": 1,
          "user.reputationScore": 1,
        },
      },
    ]);

    const disputeMetrics = await Dispute.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const alertsOpenCount = await MonitoringAlert.countDocuments({ status: "open" });

    res.json({
      success: true,
      analytics: {
        totalUsers,
        totalProducts,
        totalServices,
        totalOrders,
        totalBookings,
        transactionVolume: {
          orders: recentOrders.length,
          bookings: recentBookings.length,
        },
        monthlyOrderVolume: orderVolume,
        monthlyBookingVolume: bookingVolume,
        monthlyTotalVolume: orderVolume + bookingVolume,
        categoryActivity,
        revenueFlow,
        bookingRevenueFlow,
        serviceBookingTrends,
        topSellers,
        topProviders,
        performanceMetrics: {
          sellerPerformance,
          providerPerformance,
        },
        disputeMetrics,
        openMonitoringAlerts: alertsOpenCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/flagged
export const getFlaggedContent = async (req, res, next) => {
  try {
    const flaggedProducts = await Product.find({ isFlagged: true })
      .populate("seller", "username fullName")
      .sort({ updatedAt: -1 });

    res.json({ success: true, flaggedProducts });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/flag/product/:id
export const flagProduct = async (req, res, next) => {
  try {
    const { isFlagged, flagReason } = req.body;

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const nextIsFlagged =
      isFlagged === true ||
      (typeof isFlagged === "string" && isFlagged.toLowerCase() === "true");
    const nextIsUnflagged =
      isFlagged === false ||
      (typeof isFlagged === "string" && isFlagged.toLowerCase() === "false");

    if (!nextIsFlagged && !nextIsUnflagged) {
      return res.status(400).json({ success: false, message: "isFlagged must be true or false" });
    }

    const wasFlagged = product.isFlagged;
    product.isFlagged = nextIsFlagged;
    product.flagReason = nextIsFlagged ? (flagReason || "Flagged by admin") : "";
    await product.save();

    if (product.seller && wasFlagged !== product.isFlagged) {
      await createNotification({
        recipient: product.seller,
        sender: req.user._id,
        type: product.isFlagged ? "product_flagged" : "product_unflagged",
        title: product.isFlagged ? "Product flagged" : "Product flag removed",
        body: product.isFlagged
          ? `Your product "${product.title}" was flagged. Reason: ${product.flagReason}`
          : `Your product "${product.title}" is no longer flagged.`,
        link: `/products/${product._id}`,
        entityId: product._id,
        entityType: "product",
      });
    }

    res.json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/activity
export const getActivityLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, action, userId } = req.query;
    const query = {};
    if (action) query.action = action;
    if (userId) query.user = userId;

    const logs = await ActivityLog.find(query)
      .populate("user", "username fullName")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await ActivityLog.countDocuments(query);

    res.json({
      success: true,
      logs,
      pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/suspicious
export const getSuspiciousActivity = async (req, res, next) => {
  try {
    const sevenDaysAgo = getDateRangeForDays(7);

    const excessiveCancellers = await Order.aggregate([
      { $match: { status: "cancelled", updatedAt: { $gte: sevenDaysAgo } } },
      { $group: { _id: "$buyer", cancelCount: { $sum: 1 } } },
      { $match: { cancelCount: { $gte: 3 } } },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          cancelCount: 1,
          "user.username": 1,
          "user.fullName": 1,
          "user.email": 1,
        },
      },
    ]);

    const suspiciousListers = await Product.aggregate([
      { $match: { createdAt: { $gte: getDateRangeForDays(1) } } },
      { $group: { _id: "$seller", listingCount: { $sum: 1 } } },
      { $match: { listingCount: { $gte: 6 } } },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          listingCount: 1,
          "user.username": 1,
          "user.fullName": 1,
          "user.email": 1,
        },
      },
    ]);

    const openAlerts = await MonitoringAlert.countDocuments({ status: "open" });

    res.json({
      success: true,
      suspicious: {
        excessiveCancellers,
        suspiciousListers,
        flaggedProducts: await Product.countDocuments({ isFlagged: true }),
        openAlerts,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/monitoring/scan
export const runMonitoringScan = async (req, res, next) => {
  try {
    const alerts = await runMonitoringDetection();
    res.json({
      success: true,
      generated: alerts.length,
      alerts,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/monitoring/alerts
export const getMonitoringAlerts = async (req, res, next) => {
  try {
    const { page = 1, limit = 25, status = "open", alertType } = req.query;

    const query = {};
    if (status && status !== "all") query.status = status;
    if (alertType) query.alertType = alertType;

    const [alerts, total] = await Promise.all([
      MonitoringAlert.find(query)
        .populate("user", "username fullName email role")
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit)),
      MonitoringAlert.countDocuments(query),
    ]);

    res.json({
      success: true,
      alerts,
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

// PATCH /api/admin/monitoring/alerts/:id
export const updateMonitoringAlertStatus = async (req, res, next) => {
  try {
    const status = normalizeMonitoringStatus(req.body.status);
    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Invalid monitoring alert status",
      });
    }

    const alert = await MonitoringAlert.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate("user", "username fullName email");

    if (!alert) {
      return res.status(404).json({ success: false, message: "Alert not found" });
    }

    res.json({ success: true, alert });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/reports-summary
// Provides a high-level overview of pending disputes, flagged content, and monitoring alerts.
export const getReportsSummary = async (req, res, next) => {
  try {
    const [openAlerts, flaggedProducts, pendingDisputes] = await Promise.all([
      MonitoringAlert.countDocuments({ status: "open" }),
      Product.countDocuments({ isFlagged: true }),
      Dispute.countDocuments({ status: { $in: ["Submitted", "Under Review"] } }),
    ]);

    res.json({
      success: true,
      summary: {
        openAlerts,
        flaggedProducts,
        pendingDisputes,
        totalIssues: openAlerts + flaggedProducts + pendingDisputes
      }
    });
  } catch (error) {
    next(error);
  }
};
