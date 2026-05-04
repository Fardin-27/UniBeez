// Module: Authentication & User Management – developed by Member 1
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

/**
 * Verify JWT token from cookies
 */
export const verifyToken = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized - No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized - User not found" });
    }

    if (!user.isActive) {
      return res
        .status(403)
        .json({ success: false, message: "Account has been deactivated" });
    }

    if (user.isRestricted) {
      return res
        .status(403)
        .json({ success: false, message: "your account is restricted" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res
      .status(401)
      .json({ success: false, message: "Unauthorized - Invalid token" });
  }
};

/**
 * Role-based access control middleware
 * Usage: authorizeRoles("admin", "seller")
 */
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized - Not authenticated" });
    }

    // UniBeez uses a universal-access model for seller features.
    // Any authenticated user should pass routes gated as seller/admin.
    if (roles.includes("seller")) {
      return next();
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): ${roles.join(", ")}`,
      });
    }

    next();
  };
};
