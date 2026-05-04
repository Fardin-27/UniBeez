import mongoose from "mongoose";
import crypto from "crypto";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["buyer", "seller", "admin"],
      default: "buyer",
    },
    studentId: {
      type: String,
      trim: true,
    },
    department: {
      type: String,
      trim: true,
    },
    university: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    avatar: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      maxlength: 500,
      default: "",
    },
    reputationScore: {
      type: Number,
      default: 0,
    },
    totalCompletedTransactions: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isRestricted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Hash password before save
userSchema.pre("save", function (next) {
  if (!this.isModified("password")) return next();
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(this.password, salt, 10000, 64, "sha512")
    .toString("hex");
  this.password = `${salt}:${hash}`;
  next();
});

// Compare password method
userSchema.methods.comparePassword = function (candidatePassword) {
  const [salt, hash] = this.password.split(":");
  const candidateHash = crypto
    .pbkdf2Sync(candidatePassword, salt, 10000, 64, "sha512")
    .toString("hex");
  return hash === candidateHash;
};

// Index for search
userSchema.index({ username: "text", fullName: "text", email: "text" });

const User = mongoose.model("User", userSchema);
export default User;
