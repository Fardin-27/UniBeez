// Admin & Feedback module
import Dispute from "../models/dispute.model.js";
import Order from "../models/order.model.js";
import ServiceBooking from "../models/serviceBooking.model.js";
import ActivityLog from "../models/activityLog.model.js";

const validStatuses = ["Submitted", "Under Review", "Resolved", "Rejected"];

// POST /api/disputes
export const submitDispute = async (req, res, next) => {
  try {
    const {
      transactionType,
      complaintType,
      description,
      againstUserId,
      evidenceUrls = [],
    } = req.body;

    if (!transactionType || !complaintType || !description?.trim()) {
      return res.status(400).json({
        success: false,
        message: "transactionType, complaintType and description are required",
      });
    }

    if (!["order", "booking"].includes(transactionType)) {
      return res.status(400).json({
        success: false,
        message: "transactionType must be order or booking",
      });
    }

    const dispute = await Dispute.create({
      reporter: req.user._id,
      againstUser: againstUserId || null,
      transactionType,
      complaintType,
      description: description.trim(),
      evidenceUrls,
      status: "Submitted",
    });

    await ActivityLog.create({
      user: req.user._id,
      action: "create",
      description: `Submitted dispute #${dispute._id}`,
      entityType: "dispute",
      entityId: dispute._id,
      metadata: {
        transactionType,
        complaintType,
      },
    });

    res.status(201).json({ success: true, dispute });
  } catch (error) {
    next(error);
  }
};

// GET /api/disputes/my
export const getMyDisputes = async (req, res, next) => {
  try {
    const { status, transactionType, page = 1, limit = 20 } = req.query;
    const query = {
      $or: [{ reporter: req.user._id }, { againstUser: req.user._id }],
    };

    if (status) query.status = status;
    if (transactionType) query.transactionType = transactionType;

    const [disputes, total] = await Promise.all([
      Dispute.find(query)
        .populate("reporter", "fullName username")
        .populate("againstUser", "fullName username")
        .populate("adminResolution.resolvedBy", "fullName username")
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit)),
      Dispute.countDocuments(query),
    ]);

    res.json({
      success: true,
      disputes,
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

// GET /api/disputes/:id
export const getDisputeById = async (req, res, next) => {
  try {
    const dispute = await Dispute.findById(req.params.id)
      .populate("reporter", "fullName username email")
      .populate("againstUser", "fullName username email")
      .populate("adminResolution.resolvedBy", "fullName username");

    if (!dispute) {
      return res.status(404).json({ success: false, message: "Dispute not found" });
    }

    const userId = req.user._id.toString();
    if (
      dispute.reporter._id.toString() !== userId &&
      dispute.againstUser?._id.toString() !== userId &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    res.json({ success: true, dispute });
  } catch (error) {
    next(error);
  }
};

// GET /api/disputes - Admin
export const getAllDisputes = async (req, res, next) => {
  try {
    const { status, complaintType, transactionType, page = 1, limit = 30 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (complaintType) query.complaintType = complaintType;
    if (transactionType) query.transactionType = transactionType;

    const [disputes, total] = await Promise.all([
      Dispute.find(query)
        .populate("reporter", "fullName username email")
        .populate("againstUser", "fullName username email")
        .populate("adminResolution.resolvedBy", "fullName username")
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit)),
      Dispute.countDocuments(query),
    ]);

    res.json({
      success: true,
      disputes,
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

// PATCH /api/disputes/:id/resolve - Admin
export const resolveDispute = async (req, res, next) => {
  try {
    const {
      status,
      action = "none",
      notes = "",
      refundAmount = 0,
    } = req.body;

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    if (!["none", "warning", "refund"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Invalid resolution action",
      });
    }

    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) {
      return res.status(404).json({ success: false, message: "Dispute not found" });
    }

    if (status) {
      dispute.status = status;
    } else if (action !== "none") {
      dispute.status = "Resolved";
    }

    dispute.adminResolution.action = action;
    dispute.adminResolution.notes = notes;
    dispute.adminResolution.refundAmount = Number(refundAmount) || 0;
    dispute.adminResolution.resolvedBy = req.user._id;
    dispute.adminResolution.resolvedAt = new Date();

    await dispute.save();

    await ActivityLog.create({
      user: req.user._id,
      action: "update",
      description: `Resolved dispute #${dispute._id} with action ${action}`,
      entityType: "dispute",
      entityId: dispute._id,
      metadata: {
        status: dispute.status,
        action,
        refundAmount: dispute.adminResolution.refundAmount,
      },
    });

    res.json({ success: true, dispute });
  } catch (error) {
    next(error);
  }
};
