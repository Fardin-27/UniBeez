import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";
import type { Order } from "../types";

const OrderHistoryPage: React.FC = () => {
  const { API_URL } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/orders/my`, { credentials: "include" });
        const data = await res.json();
        setOrders(data.orders || []);
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, []);

  const statusColor: Record<string, string> = {
    pending: "bg-amber-50 text-amber-600 border border-amber-100",
    confirmed: "bg-blue-50 text-blue-600 border border-blue-100",
    delivered: "bg-emerald-50 text-emerald-600 border border-emerald-100",
    cancelled: "bg-red-50 text-red-500 border border-red-100",
  };

  if (loading) return <LoadingSpinner text="Loading orders..." />;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-extrabold text-slate-900 mb-8">My Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-card">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <p className="text-slate-400 text-lg font-medium">No orders yet</p>
          <Link to="/marketplace" className="mt-4 inline-flex items-center gap-2 text-brand-600 font-semibold hover:text-brand-700 transition-colors text-sm">
            Start Shopping
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link
              key={order._id}
              to={`/orders/${order._id}`}
              className="block bg-white border border-slate-100 rounded-2xl shadow-card p-5 hover:shadow-card-hover transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-sm font-semibold text-slate-700">Order #{order._id.slice(-8)}</span>
                  <span className="text-xs text-slate-400 ml-3">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${statusColor[order.status] || "bg-slate-100"}`}>
                  {order.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">{order.items.length} item(s)</span>
                <span className="font-extrabold text-brand-600">৳{order.totalAmount}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderHistoryPage;
