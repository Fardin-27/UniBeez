// Product & Transaction module
import SSLCommerzPayment from "sslcommerz-lts";
import Order from "../models/order.model.js";

const getSslConfig = () => ({
  storeId: process.env.SSLCOMMERZ_STORE_ID,
  storePassword: process.env.SSLCOMMERZ_STORE_PASSWORD,
  isLive: String(process.env.SSLCOMMERZ_IS_LIVE).toLowerCase() === "true",
});

const getServerBaseUrl = (req) => {
  if (process.env.BACKEND_URL) return process.env.BACKEND_URL;
  return `${req.protocol}://${req.get("host")}`;
};

const getClientBaseUrl = () => process.env.CLIENT_URL || "http://localhost:5173";

const createSslInstance = () => {
  const { storeId, storePassword, isLive } = getSslConfig();
  return new SSLCommerzPayment(storeId, storePassword, isLive);
};

const findOrderForCallback = async ({ orderId, tranId }) => {
  if (orderId) {
    const orderById = await Order.findById(orderId);
    if (orderById) return orderById;
  }

  if (tranId) {
    const orderByTran = await Order.findOne({ paymentTransactionId: tranId });
    if (orderByTran) return orderByTran;
  }

  return null;
};

const updateOrderAsFailed = async (order, payload = null) => {
  order.status = "failed";
  order.paymentGateway = "sslcommerz";
  if (payload) {
    order.paymentGatewayResponse = payload;
  }
  await order.save();
};

// POST /api/payment/init
export const initPayment = async (req, res, next) => {
  try {
    const { storeId, storePassword } = getSslConfig();

    if (!storeId || !storePassword) {
      return res.status(500).json({
        success: false,
        message: "SSLCommerz credentials are missing in environment variables",
      });
    }

    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "orderId is required",
      });
    }

    const order = await Order.findById(orderId).populate("buyer", "fullName email phone");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.buyer._id.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to pay for this order",
      });
    }

    if (order.status === "paid") {
      return res.status(400).json({
        success: false,
        message: "Order is already paid",
      });
    }

    const serverBaseUrl = getServerBaseUrl(req);
    const tranId = `ORDER_${order._id}_${Date.now()}`;
    const sslcz = createSslInstance();

    const paymentPayload = {
      total_amount: Number(order.totalAmount),
      currency: "BDT",
      tran_id: tranId,
      success_url: `${serverBaseUrl}/api/payment/success`,
      fail_url: `${serverBaseUrl}/api/payment/fail`,
      cancel_url: `${serverBaseUrl}/api/payment/cancel`,
      ipn_url: `${serverBaseUrl}/api/payment/success`,
      shipping_method: "NO",
      product_name: `Order-${order._id}`,
      product_category: "Ecommerce",
      product_profile: "general",
      cus_name: order.buyer?.fullName || "UniSphere User",
      cus_email: order.buyer?.email || "buyer@example.com",
      cus_add1: order.deliveryAddress || "N/A",
      cus_city: "Dhaka",
      cus_state: "Dhaka",
      cus_postcode: "1200",
      cus_country: "Bangladesh",
      cus_phone: order.buyer?.phone || "01700000000",
      ship_name: order.buyer?.fullName || "UniSphere User",
      ship_add1: order.deliveryAddress || "N/A",
      ship_city: "Dhaka",
      ship_state: "Dhaka",
      ship_postcode: 1200,
      ship_country: "Bangladesh",
      value_a: String(order._id),
      value_b: String(order.buyer._id),
      value_c: "unisphere-product-order",
      value_d: "",
    };

    const apiResponse = await sslcz.init(paymentPayload);

    if (!apiResponse?.GatewayPageURL) {
      return res.status(502).json({
        success: false,
        message: "Failed to initialize SSLCommerz payment session",
      });
    }

    order.paymentMethod = "sslcommerz";
    order.paymentGateway = "sslcommerz";
    order.paymentTransactionId = tranId;
    order.paymentGatewayResponse = {
      sessionkey: apiResponse.sessionkey || "",
      initiatedAt: new Date().toISOString(),
    };
    await order.save();

    return res.status(200).json({
      success: true,
      paymentUrl: apiResponse.GatewayPageURL,
      tranId,
      orderId: order._id,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/payment/success
export const paymentSuccess = async (req, res, next) => {
  try {
    const { val_id: valId, tran_id: tranId, value_a: orderId } = req.body || {};

    const order = await findOrderForCallback({ orderId, tranId });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found for payment callback",
      });
    }

    if (!valId) {
      await updateOrderAsFailed(order, req.body || null);
      return res.status(400).json({
        success: false,
        message: "Missing val_id in success callback",
      });
    }

    const sslcz = createSslInstance();
    const validationResponse = await sslcz.validate({ val_id: valId });
    const validationStatus = String(validationResponse?.status || "").toUpperCase();
    const isValid = validationStatus === "VALID" || validationStatus === "VALIDATED";

    order.paymentValId = valId;
    order.paymentGateway = "sslcommerz";
    order.paymentGatewayResponse = validationResponse || req.body || null;

    if (isValid) {
      order.status = "paid";
      await order.save();

      return res.status(200).json({
        success: true,
        message: "Payment validated successfully",
        orderId: order._id,
      });
    }

    order.status = "failed";
    await order.save();

    return res.status(400).json({
      success: false,
      message: "Payment validation failed",
      orderId: order._id,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/payment/fail
export const paymentFail = async (req, res, next) => {
  try {
    const { tran_id: tranId, value_a: orderId } = req.body || {};

    const order = await findOrderForCallback({ orderId, tranId });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found for payment failure callback",
      });
    }

    await updateOrderAsFailed(order, req.body || null);

    return res.status(200).json({
      success: true,
      message: "Payment failed and order updated",
      orderId: order._id,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/payment/cancel
export const paymentCancel = async (req, res, next) => {
  try {
    const { tran_id: tranId, value_a: orderId } = req.body || {};

    const order = await findOrderForCallback({ orderId, tranId });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found for payment cancel callback",
      });
    }

    await updateOrderAsFailed(order, req.body || null);

    return res.status(200).json({
      success: true,
      message: "Payment cancelled and order updated",
      orderId: order._id,
    });
  } catch (error) {
    next(error);
  }
};

export const paymentCallbackRedirect = (req, res) => {
  const clientBaseUrl = getClientBaseUrl();
  const orderId = req.body?.value_a || "";
  const status = req.path.includes("success") ? "success" : "failed";
  res.redirect(`${clientBaseUrl}/order-confirmation?orderId=${orderId}&payment=${status}`);
};
