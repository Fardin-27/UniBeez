import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import User from "./models/user.model.js";
import ServiceBooking from "./models/serviceBooking.model.js";

// Route imports
import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import productRoutes from "./routes/product.route.js";
import { syncProductAvailability } from "./controllers/product.controller.js";
import cartRoutes from "./routes/cart.route.js";
import orderRoutes from "./routes/order.route.js";
import adminRoutes from "./routes/admin.route.js";
import serviceRoutes from "./routes/service.route.js";
import bookingRoutes from "./routes/booking.route.js";
import timeSlotRoutes from "./routes/timeSlot.route.js";
import paymentRoutes from "./routes/payment.route.js";
import feedbackRoutes from "./routes/feedback.route.js";
import messagingRoutes from "./routes/messaging.route.js";
import activityRoutes from "./routes/activity.route.js";
import disputeRoutes from "./routes/dispute.route.js";
import notificationRoutes from "./routes/notification.route.js";

// Middleware
import { errorHandler } from "./middleware/error.middleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

// ─── Middleware ──────────────────────────────────────────────────────────────

app.use(express.json());
app.use(cookieParser());

const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      "http://localhost:5173",
      process.env.CLIENT_URL,
    ].filter(Boolean);

    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);

    callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

// Static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ─── API Routes ──────────────────────────────────────────────────────────────

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/timeslots", timeSlotRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/messages", messagingRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/disputes", disputeRoutes);
app.use("/api/notifications", notificationRoutes);

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to UniSphere API",
    version: "1.0.0",
    endpoints: [
      "/api/auth",
      "/api/users",
      "/api/products",
      "/api/cart",
      "/api/orders",
      "/api/admin",
      "/api/services",
      "/api/bookings",
      "/api/timeslots",
      "/api/payment",
      "/api/feedback",
      "/api/messages",
      "/api/activity",
      "/api/disputes",
    ],
  });
});

// ─── Error Handling ──────────────────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.url}`,
  });
});

app.use(errorHandler);

// ─── Start Server ────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;

// Start server immediately
app.listen(PORT, () => {
  console.log(`\nUniSphere API running on port ${PORT}`);
  console.log("\nAvailable routes:");
  console.log("  /api/auth          - Authentication");
  console.log("  /api/users         - User management");
  console.log("  /api/products      - Product marketplace");
  console.log("  /api/cart          - Shopping cart");
  console.log("  /api/orders        - Order management");
  console.log("  /api/admin         - Admin panel");
  console.log("  /api/services      - Services marketplace");
  console.log("  /api/bookings      - Booking management");
  console.log("  /api/timeslots     - Time slot management");
  console.log("  /api/payment       - SSLCommerz payment");
  console.log("  /api/feedback      - Ratings and feedback");
  console.log("  /api/messages      - User messaging");
  console.log("  /api/activity      - User activity history");
  console.log("  /api/disputes      - Dispute management");
});

// Connect to MongoDB (non-blocking)
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("\n✅ Connected to MongoDB");
    ensureServiceBookingIndexes();
    ensureAdminUser();
    syncProductAvailability()
      .then(({ restocked, soldOut }) => {
        if (restocked || soldOut) {
          console.log(
            `Product availability synced: ${restocked} restocked, ${soldOut} sold out`
          );
        }
      })
      .catch((error) => {
        console.error("Error syncing product availability:", error.message);
      });
  })
  .catch((err) => {
    console.error("\n⚠️  MongoDB connection error:", err.message);
    console.log("⚠️  Server is running but database operations may fail");
    console.log("⚠️  Please check your MongoDB connection string and network access");
  });

const ensureAdminUser = async () => {
  const adminEmail = "admin@gmail.com";
  const adminPassword = "123456";

  try {
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (!existingAdmin) {
      const adminUser = new User({
        username: "admin",
        fullName: "System Administrator",
        email: adminEmail,
        password: adminPassword,
        role: "admin",
      });

      await adminUser.save();
      console.log("Admin user created successfully.");
    } else {
      console.log("Admin user already exists.");
    }
  } catch (error) {
    console.error("Error ensuring admin user:", error);
  }
};

const ensureServiceBookingIndexes = async () => {
  try {
    let indexes = [];
    try {
      indexes = await ServiceBooking.collection.indexes();
    } catch (error) {
      const isMissingCollection =
        error?.codeName === "NamespaceNotFound" ||
        /ns does not exist/i.test(error?.message || "");

      if (!isMissingCollection) {
        throw error;
      }
    }

    const obsoleteUniqueIndexes = indexes.filter((index) => {
      const keys = Object.keys(index.key || {});
      const isServiceBuyerIndex =
        keys.length === 2 &&
        index.key.service === 1 &&
        index.key.buyer === 1;
      const isServiceBuyerDateIndex =
        keys.length === 3 &&
        index.key.service === 1 &&
        index.key.buyer === 1 &&
        index.key.bookingDate === 1;

      return index.unique === true && (isServiceBuyerIndex || isServiceBuyerDateIndex);
    });

    for (const index of obsoleteUniqueIndexes) {
      await ServiceBooking.collection.dropIndex(index.name);
      console.log(`Dropped obsolete unique service booking index: ${index.name}`);
    }

    await ServiceBooking.createIndexes();
  } catch (error) {
    console.error("Error ensuring service booking indexes:", error.message);
  }
};

export default app;
