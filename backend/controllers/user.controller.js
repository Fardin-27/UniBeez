import User from "../models/user.model.js";
import ActivityLog from "../models/activityLog.model.js";

const escapeRegex = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const parseOptionalBoolean = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;
  }
  return undefined;
};

// GET /api/users - Admin: get all users
export const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, role } = req.query;
    const query = {};

    if (search) {
      const trimmedSearch = String(search).trim();
      const wordStartRegex = new RegExp(`\\b${escapeRegex(trimmedSearch)}`, "i");
      query.$or = [
        { fullName: { $regex: wordStartRegex } },
        { username: { $regex: wordStartRegex } },
        { email: { $regex: wordStartRegex } },
      ];
    }
    if (role) {
      query.role = role;
    }

    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      users,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/users/:id
export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// PUT /api/users/profile
export const updateProfile = async (req, res, next) => {
  try {
    const { fullName, phone, department, university, bio, avatar } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { fullName, phone, department, university, bio, avatar },
      { new: true, runValidators: true }
    ).select("-password");

    await ActivityLog.create({
      user: req.user._id,
      action: "profile_updated",
      description: "Profile updated",
    });

    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/users/:id/role - Admin: change user role
export const changeUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const validRoles = ["buyer", "seller", "admin"];

    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, user, message: `Role updated to ${role}` });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/users/:id/status - Admin: toggle active/restricted
export const toggleUserStatus = async (req, res, next) => {
  try {
    const { isActive, isRestricted } = req.body;

    const update = {};
    const parsedIsActive = parseOptionalBoolean(isActive);
    const parsedIsRestricted = parseOptionalBoolean(isRestricted);
    if (parsedIsActive !== undefined) update.isActive = parsedIsActive;
    if (parsedIsRestricted !== undefined) update.isRestricted = parsedIsRestricted;

    if (Object.keys(update).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide isActive or isRestricted",
      });
    }

    const user = await User.findByIdAndUpdate(req.params.id, update, {
      new: true,
    }).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const statusChanges = [];
    if (Object.prototype.hasOwnProperty.call(update, "isRestricted")) {
      statusChanges.push(user.isRestricted ? "restricted" : "unrestricted");
    }
    if (Object.prototype.hasOwnProperty.call(update, "isActive")) {
      statusChanges.push(user.isActive ? "activated" : "deactivated");
    }

    await ActivityLog.create({
      user: req.user._id,
      action: "update",
      description: `${user.fullName} ${statusChanges.join(" and ")}`,
      entityType: "user",
      entityId: user._id,
      metadata: update,
    });

    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// PUT /api/users/:id/toggle-status - Admin: compatibility toggle for restriction
export const toggleUserRestriction = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.isRestricted = !user.isRestricted;
    await user.save();

    await ActivityLog.create({
      user: req.user._id,
      action: "update",
      description: `${user.fullName} ${user.isRestricted ? "restricted" : "unrestricted"}`,
      entityType: "user",
      entityId: user._id,
      metadata: { isRestricted: user.isRestricted },
    });

    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};
