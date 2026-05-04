/**
 * Global error handling middleware
 */
export const errorHandler = (err, req, res, next) => {
  console.error("Error:", err.message);
  if (err.stack) {
    console.error("Error stack:", err.stack);
  }

  const rawMessage = err.message || "";
  const looksLikeObjectIdCastError =
    err.name === "CastError" ||
    /24 character hex string|12 byte Uint8Array/i.test(rawMessage);

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: messages[0] || "Validation error",
      errors: messages,
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json({
      success: false,
      message: `Duplicate value for ${field}`,
    });
  }

  // Mongoose cast error (invalid ObjectId)
  if (looksLikeObjectIdCastError) {
    return res.status(400).json({
      success: false,
      message: "Invalid ID format",
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Token expired",
    });
  }

  // Multer file size error
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      message: "File too large. Maximum size is 5MB",
    });
  }

  const statusCode = err.statusCode || 500;
  const baseMessage = looksLikeObjectIdCastError ? "Invalid ID format" : rawMessage || "Internal server error";

  res.status(statusCode).json({
    success: false,
    message: baseMessage,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
