import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import {
  initSslCommerzPayment,
  redirectToPaymentGateway,
} from "../utils/payment";

const CheckoutPage: React.FC = () => {
  const { user, API_URL } = useAuth();
  const { items, clearCart } = useCart();
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState("cash_on_delivery");
  const [shippingAddress, setShippingAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const total = items.reduce((sum, item) => {
    const product = typeof item.product === "object" ? item.product : null;
    return sum + (product ? product.price * item.quantity : 0);
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ paymentMethod, deliveryAddress: shippingAddress }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Order failed");
      await clearCart();

      if (paymentMethod === "sslcommerz") {
        const createdOrders = data.orders || [];

        if (createdOrders.length === 0) {
          throw new Error("Order was created but no order id was returned for payment");
        }

        const primaryOrderId = createdOrders[0]._id;
        const paymentSession = await initSslCommerzPayment(API_URL, primaryOrderId);
        redirectToPaymentGateway(paymentSession.paymentUrl);
        return;
      }

      navigate("/order-confirmation", { state: { orders: data.orders } });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) { navigate("/login"); return null; }
  if (items.length === 0) { navigate("/cart"); return null; }

  const paymentOptions = [
    { value: "cash_on_delivery", label: "Cash on Delivery", icon: "💵" },
    { value: "sslcommerz", label: "SSLCommerz", icon: "🔐" },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-extrabold text-slate-900 mb-8">Checkout</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <div className="bg-red-50 text-red-600 text-sm p-4 rounded-2xl border border-red-100 font-medium">{error}</div>}

        {/* Order Summary */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6">
          <h2 className="font-bold text-slate-800 mb-4">Order Summary</h2>
          <div className="divide-y divide-slate-100">
            {items.map((item) => {
              const product = typeof item.product === "object" ? item.product : null;
              if (!product) return null;
              return (
                <div key={product._id} className="py-3 flex justify-between text-sm">
                  <span className="text-slate-600">{product.title} <span className="text-slate-400">x{item.quantity}</span></span>
                  <span className="font-semibold text-slate-800">৳{(product.price * item.quantity).toFixed(2)}</span>
                </div>
              );
            })}
          </div>
          <div className="border-t border-slate-100 mt-3 pt-4 flex justify-between items-center">
            <span className="font-bold text-slate-800">Total</span>
            <span className="text-2xl font-extrabold text-brand-600">৳{total.toFixed(2)}</span>
          </div>
        </div>

        {/* Shipping */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6">
          <h2 className="font-bold text-slate-800 mb-4">Delivery Address</h2>
          <textarea
            required
            value={shippingAddress}
            onChange={(e) => setShippingAddress(e.target.value)}
            placeholder="Enter your campus / delivery address"
            rows={3}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 focus:bg-white transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Payment */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6">
          <h2 className="font-bold text-slate-800 mb-4">Payment Method</h2>
          <div className="grid grid-cols-2 gap-3">
            {paymentOptions.map((m) => (
              <label
                key={m.value}
                className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                  paymentMethod === m.value
                    ? "border-brand-500 bg-brand-50"
                    : "border-slate-200 hover:border-brand-300 hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  value={m.value}
                  checked={paymentMethod === m.value}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="sr-only"
                />
                <span className="text-lg">{m.icon}</span>
                <span className={`text-sm font-medium ${
                  paymentMethod === m.value ? "text-brand-700" : "text-slate-600"
                }`}>{m.label}</span>
              </label>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-gradient-to-r from-brand-500 to-brand-600 text-white font-bold rounded-2xl hover:from-brand-600 hover:to-brand-700 disabled:opacity-50 shadow-sm hover:shadow-glow transition-all duration-300 text-sm"
        >
          {loading ? "Placing Order..." : `Place Order — ৳${total.toFixed(2)}`}
        </button>
      </form>
    </div>
  );
};

export default CheckoutPage;
