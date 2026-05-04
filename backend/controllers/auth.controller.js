import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import ActivityLog from "../models/activityLog.model.js";

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

const cookieOptions = (req) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});

// POST /api/auth/register
export const register = async (req, res, next) => {
  try {
    const { username, email, password, fullName, studentId, department, university, phone } = req.body;

    if (!username || !email || !password || !fullName) {
      return res.status(400).json({ success: false, message: "Username, email, password and full name are required" });
    }

    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ 
        success: false, 
        message: "Database is unavailable. Please try again later.",
        error: "MongoDB connection failed"
      });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(409).json({ success: false, message: "User with this email or username already exists" });
    }

    // Set default role as "seller" to allow all users to sell products and share skills
    const user = await User.create({
      username,
      email,
      password,
      fullName,
      studentId,
      department,
      university,
      phone,
      role: "seller", // All users can sell products and share skills
    });

    const token = generateToken(user._id);
    res.cookie("token", token, cookieOptions(req));

    const userObj = user.toObject();
    userObj._id = userObj._id.toString(); // Ensure _id is a string
    delete userObj.password;

    res.status(201).json({ success: true, message: "Registration successful", user: userObj });
  } catch (error) {
    console.error("Register error:", error.message);
    
    // Handle MongoDB timeout errors
    if (error.message.includes("buffering timed out") || error.message.includes("ECONNREFUSED")) {
      return res.status(503).json({
        success: false,
        message: "Database connection timeout. Please try again.",
        error: "MongoDB unavailable"
      });
    }
    
    next(error);
  }
};

// POST /api/auth/login
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ 
        success: false, 
        message: "Database is unavailable. Please try again later.",
        error: "MongoDB connection failed"
      });
    }

    // Allow logging in with either email or username
    const user = await User.findOne({ $or: [{ email }, { username: email }] });
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: "Account has been deactivated" });
    }

    if (user.isRestricted) {
      return res.status(403).json({ success: false, message: "your account is restricted" });
    }

    const isMatch = user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    // Log activity
    await ActivityLog.create({
      user: user._id,
      action: "login",
      description: "User logged in",
    });

    const token = generateToken(user._id);
    res.cookie("token", token, cookieOptions(req));

    const userObj = user.toObject();
    userObj._id = userObj._id.toString(); // Ensure _id is a string
    delete userObj.password;

    res.json({ success: true, message: "Login successful", user: userObj });
  } catch (error) {
    console.error("Login error:", error.message);
    
    // Handle MongoDB timeout errors
    if (error.message.includes("buffering timed out") || error.message.includes("ECONNREFUSED")) {
      return res.status(503).json({
        success: false,
        message: "Database connection timeout. Please try again.",
        error: "MongoDB unavailable"
      });
    }
    
    next(error);
  }
};

// GET /api/auth/profile
export const getProfile = async (req, res, next) => {
  try {
    res.json({ success: true, user: req.user });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/logout
export const logout = async (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    expires: new Date(0),
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: process.env.NODE_ENV === "production",
  });
  res.json({ success: true, message: "Logged out successfully" });
};
