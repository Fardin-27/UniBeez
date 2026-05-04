// Product & Transaction module
import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  title: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
});

const orderSchema = new mongoose.Schema(
  {
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [orderItemSchema],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "paid", "failed", "delivered", "confirmed", "cancelled"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["cash_on_delivery", "bkash", "nagad", "campus_pay", "sslcommerz"],
      default: "cash_on_delivery",
    },
    paymentTransactionId: {
      type: String,
      default: "",
    },
    paymentValId: {
      type: String,
      default: "",
    },
    paymentGateway: {
      type: String,
      default: "",
    },
    paymentGatewayResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    deliveryAddress: {
      type: String,
      required: true,
    },
    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

orderSchema.index({ buyer: 1, createdAt: -1 });
orderSchema.index({ seller: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentTransactionId: 1 });

const Order = mongoose.model("Order", orderSchema);
export default Order;
