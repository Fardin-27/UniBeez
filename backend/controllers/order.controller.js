import Order from "../models/order.model.js";
import Cart from "../models/cart.model.js";
import Product from "../models/product.model.js";
import ActivityLog from "../models/activityLog.model.js";
import { recalculateUserReputation } from "../lib/reputation.js";
import { createNotification } from "../lib/notify.js";

const summarizeOrderItems = (items = []) => {
  if (!items.length) return "your product";

  const [firstItem, ...rest] = items;
  if (!rest.length) return firstItem.title;

  return `${firstItem.title} and ${rest.length} other item${rest.length > 1 ? "s" : ""}`;
};

// POST /api/orders
export const createOrder = async (req, res, next) => {
  try {
    const { paymentMethod, deliveryAddress, notes } = req.body;

    const paymentMethodInput = String(paymentMethod || "cash_on_delivery")
      .trim()
      .toLowerCase();

    const paymentMethodAliases = {
      "ssl_commerz": "sslcommerz",
      "ssl-commerz": "sslcommerz",
    };

    const normalizedPaymentMethod =
      paymentMethodAliases[paymentMethodInput] || paymentMethodInput;

    const allowedPaymentMethods = [
      "cash_on_delivery",
      "bkash",
      "nagad",
      "campus_pay",
      "sslcommerz",
    ];

    if (!allowedPaymentMethods.includes(normalizedPaymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method",
      });
    }

    if (!deliveryAddress) {
      return res.status(400).json({ success: false, message: "Delivery address is required" });
    }

    const cart = await Cart.findOne({ user: req.user._id }).populate("items.product");
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    // Group items by seller
    const sellerGroups = {};
    for (const item of cart.items) {
      const product = item.product;
      if (product.quantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Product "${product.title}" is not available in requested quantity`,
        });
      }

      const sellerId = product.seller.toString();
      if (!sellerGroups[sellerId]) {
        sellerGroups[sellerId] = [];
      }
      sellerGroups[sellerId].push({
        product: product._id,
        title: product.title,
        price: product.price,
        quantity: item.quantity,
      });
    }

    // Create one order per seller
    const orders = [];
    for (const [sellerId, items] of Object.entries(sellerGroups)) {
      const totalAmount = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

      const order = await Order.create({
        buyer: req.user._id,
        seller: sellerId,
        items,
        totalAmount,
        paymentMethod: normalizedPaymentMethod,
        deliveryAddress,
        notes: notes || "",
      });

      orders.push(order);

      // Update product quantities
      for (const item of items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { quantity: -item.quantity },
        });
        const updated = await Product.findById(item.product);
        if (updated.quantity <= 0) {
          updated.isAvailable = false;
          await updated.save();
        }
      }

      await ActivityLog.create({
        user: req.user._id,
        action: "order_placed",
        description: `Placed order worth ৳${totalAmount}`,
        relatedId: order._id,
      });

      // Notify seller about new order
      await createNotification({
        recipient: sellerId,
        sender: req.user._id,
        type: "order_placed",
        title: "New Order Received",
        body: `${req.user.fullName} placed an order worth ৳${totalAmount}.`,
        link: "/seller/orders",
        entityId: order._id,
        entityType: "order",
      });
    }

    // Clear cart
    await Cart.findOneAndDelete({ user: req.user._id });

    res.status(201).json({ success: true, orders });
  } catch (error) {
    next(error);
  }
};

// GET /api/orders/my
export const getMyOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = { buyer: req.user._id };
    if (status) query.status = status;

    const orders = await Order.find(query)
      .populate("seller", "username fullName")
      .populate("items.product", "images")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      orders,
      pagination: { total, page: Number(page), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/orders/seller
export const getSellerOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = { seller: req.user._id };
    if (status) query.status = status;

    const orders = await Order.find(query)
      .populate("buyer", "username fullName phone")
      .populate("items.product", "images")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      orders,
      pagination: { total, page: Number(page), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/orders/all - Admin
export const getAllOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const query = {};
    if (status) query.status = status;

    const orders = await Order.find(query)
      .populate("buyer", "username fullName")
      .populate("seller", "username fullName")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      orders,
      pagination: { total, page: Number(page), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/orders/:id
export const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("buyer", "username fullName phone")
      .populate("seller", "username fullName phone")
      .populate("items.product", "images title");

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Only buyer, seller or admin can view
    const userId = req.user._id.toString();
    if (
      order.buyer._id.toString() !== userId &&
      order.seller._id.toString() !== userId &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    res.json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/orders/:id/status
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ["paid", "failed", "confirmed", "delivered", "cancelled"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Only seller or admin can update
    if (order.seller.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    const previousStatus = order.status;
    order.status = status;
    await order.save();

    if (status === "delivered" && previousStatus !== "delivered") {
      await ActivityLog.create({
        user: order.seller,
        action: "order_delivered",
        description: `Delivered order #${order._id}`,
        relatedId: order._id,
      });

      await recalculateUserReputation(order.seller);

      await createNotification({
        recipient: order.buyer,
        sender: req.user._id,
        type: "order_status",
        title: "Order delivered",
        body: `Your order for ${summarizeOrderItems(order.items)} has been marked as delivered.`,
        link: `/orders/${order._id}`,
        entityId: order._id,
        entityType: "order",
      });
    }

    if (status === "cancelled") {
      // Restore product quantities
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { quantity: item.quantity },
          isAvailable: true,
        });
      }

      await ActivityLog.create({
        user: req.user._id,
        action: "order_cancelled",
        description: `Cancelled order #${order._id}`,
        relatedId: order._id,
      });
    }

    res.json({ success: true, order });
  } catch (error) {
    next(error);
  }
};
