import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";
import type { Order } from "../types";

const OrderDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, API_URL } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [submittingDispute, setSubmittingDispute] = useState(false);

  const fetchOrder = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/orders/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setOrder(data.order);
    } catch { navigate("/orders"); }
    setLoading(false);
  }, [id, API_URL, navigate]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  const updateStatus = async (status: string) => {
    try {
      const res = await fetch(`${API_URL}/api/orders/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (res.ok) fetchOrder();
    } catch { /* ignore */ }
  };

  const submitFeedback = async () => {
    if (!id) return;
    try {
      setSubmittingFeedback(true);
      const res = await fetch(`${API_URL}/api/feedback/orders/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ rating, feedback }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to submit feedback");
      alert("Feedback submitted successfully");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to submit feedback");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const submitDispute = async () => {
    if (!id) return;
    const description = window.prompt("Briefly describe your complaint:");
    if (!description?.trim()) return;

    try {
      setSubmittingDispute(true);
      // Determine who we are disputing against (if buyer, dispute seller)
      const againstUserId = typeof order?.seller === 'object' ? order.seller._id : order?.seller;

      const res = await fetch(`${API_URL}/api/disputes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          transactionType: "order",
          complaintType: "inaccurate_product_description",
          description,
          againstUserId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to submit dispute");
      alert("Dispute submitted. Admin will review it.");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to submit dispute");
    } finally {
      setSubmittingDispute(false);
    }
  };



  const statusColor: Record<string, string> = {
    pending: "bg-amber-50 text-amber-600 border border-amber-100",
    confirmed: "bg-blue-50 text-blue-600 border border-blue-100",
    delivered: "bg-emerald-50 text-emerald-600 border border-emerald-100",
    cancelled: "bg-red-50 text-red-500 border border-red-100",
  };

  if (loading) return <LoadingSpinner text="Loading order..." />;
  if (!order) return null;

  const isSeller = user && typeof order.seller === "object" && order.seller._id === user._id;
  const isBuyer = user && typeof order.buyer === "object" && order.buyer._id === user._id;
  const orderSeller = typeof order.seller === "object" ? order.seller : null;
  const orderBuyer = typeof order.buyer === "object" ? order.buyer : null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Order #{order._id.slice(-8)}</h1>
          <p className="text-sm text-slate-400 mt-1">{new Date(order.createdAt).toLocaleString()}</p>
        </div>
        <span className={`text-sm px-3 py-1.5 rounded-full font-semibold capitalize ${statusColor[order.status] || "bg-slate-100"}`}>
          {order.status}
        </span>
      </div>

      {/* Items */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6 mb-6">
        <h2 className="font-bold text-slate-800 mb-4">Items</h2>
        <div className="divide-y divide-slate-100">
          {order.items.map((item, i) => (
            <div key={i} className="py-3 flex justify-between text-sm">
              <div>
                <span className="text-slate-700 font-medium">{item.title}</span>
                <span className="text-slate-400 ml-2">x{item.quantity}</span>
              </div>
              <span className="font-semibold text-slate-800">৳{(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-slate-100 mt-3 pt-4 flex justify-between items-center">
          <span className="font-bold text-slate-800">Total</span>
          <span className="text-2xl font-extrabold text-brand-600">৳{order.totalAmount}</span>
        </div>
      </div>

      {/* Details */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6 mb-6 grid sm:grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-slate-400 text-xs uppercase tracking-wider">Payment</span>
          <p className="font-semibold text-slate-700 capitalize mt-0.5">{order.paymentMethod.replace(/_/g, " ")}</p>
        </div>
        <div>
          <span className="text-slate-400 text-xs uppercase tracking-wider">Delivery Address</span>
          <p className="font-semibold text-slate-700 mt-0.5">{order.deliveryAddress}</p>
        </div>
      </div>

      {/* Seller Details */}
      {orderSeller && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6 mb-6">
          <h2 className="font-bold text-slate-800 mb-4">Seller Details</h2>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-400 text-xs uppercase tracking-wider">Name</span>
              <p className="font-semibold text-slate-700 mt-0.5">{orderSeller.fullName}</p>
            </div>
            <div>
              <span className="text-slate-400 text-xs uppercase tracking-wider">Username</span>
              <p className="font-semibold text-slate-700 mt-0.5">{orderSeller.username}</p>
            </div>
            {orderSeller.phone && (
              <div>
                <span className="text-slate-400 text-xs uppercase tracking-wider">Phone</span>
                <p className="font-semibold text-slate-700 mt-0.5">{orderSeller.phone}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Buyer Details */}
      {orderBuyer && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6 mb-6">
          <h2 className="font-bold text-slate-800 mb-4">Buyer Details</h2>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-400 text-xs uppercase tracking-wider">Name</span>
              <p className="font-semibold text-slate-700 mt-0.5">{orderBuyer.fullName}</p>
            </div>
            <div>
              <span className="text-slate-400 text-xs uppercase tracking-wider">Username</span>
              <p className="font-semibold text-slate-700 mt-0.5">{orderBuyer.username}</p>
            </div>
            <div>
              <span className="text-slate-400 text-xs uppercase tracking-wider">Phone</span>
              <p className="font-semibold text-slate-700 mt-0.5">{orderBuyer.phone}</p>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 flex-wrap">
        {isSeller && order.status === "pending" && (
          <>
            <button onClick={() => updateStatus("confirmed")} className="px-5 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 text-sm shadow-sm">
              Confirm Order
            </button>
            <button onClick={() => updateStatus("cancelled")} className="px-5 py-3 border-2 border-red-200 text-red-500 font-semibold rounded-xl hover:bg-red-50 transition-all text-sm">
              Cancel Order
            </button>
          </>
        )}
        {isSeller && order.status === "confirmed" && (
          <button onClick={() => updateStatus("delivered")} className="px-5 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 text-sm shadow-sm">
            Mark as Delivered
          </button>
        )}
        {isBuyer && order.status === "pending" && (
          <button onClick={() => updateStatus("cancelled")} className="px-5 py-3 border-2 border-red-200 text-red-500 font-semibold rounded-xl hover:bg-red-50 transition-all text-sm">
            Cancel Order
          </button>
        )}

        {isBuyer && (
          <button
            onClick={submitDispute}
            disabled={submittingDispute}
            className="px-5 py-3 border-2 border-amber-200 text-amber-700 font-semibold rounded-xl hover:bg-amber-50 transition-all text-sm disabled:opacity-60"
          >
            {submittingDispute ? "Submitting..." : "Raise Dispute"}
          </button>
        )}
      </div>

      {isBuyer && order.status === "delivered" && (
        <div className="mt-6 bg-white rounded-2xl border border-slate-100 shadow-card p-6">
          <h2 className="font-bold text-slate-800 mb-3">Rate This Order</h2>
          <div className="flex gap-2 mb-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className={`text-2xl ${star <= rating ? "text-yellow-400" : "text-slate-300"}`}
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            value={feedback}
            onChange={(event) => setFeedback(event.target.value)}
            rows={3}
            className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm"
            placeholder="Share your feedback"
          />
          <button
            onClick={submitFeedback}
            disabled={submittingFeedback}
            className="mt-3 px-5 py-2.5 bg-brand-600 text-white rounded-xl font-semibold text-sm disabled:opacity-60"
          >
            {submittingFeedback ? "Submitting..." : "Submit Feedback"}
          </button>
        </div>
      )}
    </div>
  );
};

export default OrderDetailsPage;
