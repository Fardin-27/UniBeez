// Admin & Feedback module
import Order from "../models/order.model.js";
import ServiceBooking from "../models/serviceBooking.model.js";
import Dispute from "../models/dispute.model.js";
import Conversation from "../models/conversation.model.js";

const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfDay = (date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

const matchesTransactionFilter = (typeFilter, type) =>
  !typeFilter || typeFilter === "all" || typeFilter === type;

const matchesStatusFilter = (statusFilter, status) =>
  !statusFilter || statusFilter === "all" || statusFilter === status;

// GET /api/activity/history
export const getActivityHistory = async (req, res, next) => {
  try {
    const {
      type = "all",
      status = "all",
      startDate,
      endDate,
      page = 1,
      limit = 25,
    } = req.query;

    const userId = req.user._id;

    const dateQuery = {};
    if (startDate) dateQuery.$gte = startOfDay(startDate);
    if (endDate) dateQuery.$lte = endOfDay(endDate);

    const orderQuery = {
      $or: [{ buyer: userId }, { seller: userId }],
    };
    const bookingQuery = {
      $or: [{ buyer: userId }, { provider: userId }],
    };
    const disputeQuery = { reporter: userId };

    if (Object.keys(dateQuery).length > 0) {
      orderQuery.createdAt = dateQuery;
      bookingQuery.createdAt = dateQuery;
      disputeQuery.createdAt = dateQuery;
    }

    if (status !== "all") {
      orderQuery.status = status;
      bookingQuery.status = status;
      disputeQuery.status = status;
    }

    const [orders, bookings, disputes, conversations] = await Promise.all([
      Order.find(orderQuery)
        .populate("buyer", "fullName username")
        .populate("seller", "fullName username")
        .sort({ createdAt: -1 }),
      ServiceBooking.find(bookingQuery)
        .populate("buyer", "fullName username")
        .populate("provider", "fullName username")
        .populate("service", "title")
        .sort({ createdAt: -1 }),
      Dispute.find(disputeQuery)
        .populate("againstUser", "fullName username")
        .sort({ createdAt: -1 }),
      Conversation.find({ participants: userId })
        .select("messages participants updatedAt")
        .sort({ updatedAt: -1 }),
    ]);

    const records = [];

    for (const order of orders) {
      const isBuyer = order.buyer._id.toString() === userId.toString();
      const recordType = isBuyer ? "product_purchase" : "product_sale";
      if (!matchesTransactionFilter(type, recordType)) continue;
      if (!matchesStatusFilter(status, order.status)) continue;

      records.push({
        id: order._id,
        recordType,
        status: order.status,
        amount: order.totalAmount,
        transactionType: "order",
        counterpart: isBuyer ? order.seller : order.buyer,
        createdAt: order.createdAt,
        metadata: {
          itemsCount: order.items.length,
          paymentMethod: order.paymentMethod,
        },
      });
    }

    for (const booking of bookings) {
      const isBuyer = booking.buyer._id.toString() === userId.toString();
      const recordType = isBuyer ? "service_booking" : "service_session";
      if (!matchesTransactionFilter(type, recordType)) continue;
      if (!matchesStatusFilter(status, booking.status)) continue;

      records.push({
        id: booking._id,
        recordType,
        status: booking.status,
        amount: booking.totalPrice,
        transactionType: "booking",
        counterpart: isBuyer ? booking.provider : booking.buyer,
        createdAt: booking.createdAt,
        metadata: {
          service: booking.service,
          startTime: booking.startTime,
          endTime: booking.endTime,
          bookingDate: booking.bookingDate,
        },
      });
    }

    for (const dispute of disputes) {
      if (!matchesTransactionFilter(type, "dispute")) continue;
      if (!matchesStatusFilter(status, dispute.status)) continue;

      records.push({
        id: dispute._id,
        recordType: "dispute",
        status: dispute.status,
        amount: null,
        transactionType: dispute.transactionType,
        counterpart: dispute.againstUser,
        createdAt: dispute.createdAt,
        metadata: {
          complaintType: dispute.complaintType,
          description: dispute.description,
        },
      });
    }

    records.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const total = records.length;
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const start = (pageNum - 1) * limitNum;
    const pagedRecords = records.slice(start, start + limitNum);

    const pendingOrderSales = await Order.countDocuments({
      seller: userId,
      status: { $in: ["pending", "paid", "confirmed"] },
    });
    const pendingServiceRequests = await ServiceBooking.countDocuments({
      provider: userId,
      status: "requested",
    });

    let unreadMessages = 0;
    for (const conversation of conversations) {
      unreadMessages += conversation.messages.filter(
        (message) =>
          message.sender.toString() !== userId.toString() &&
          !message.readBy.some((reader) => reader.toString() === userId.toString())
      ).length;
    }

    res.json({
      success: true,
      records: pagedRecords,
      pendingInteractions: {
        pendingOrderSales,
        pendingServiceRequests,
        unreadMessages,
      },
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};
