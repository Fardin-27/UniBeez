import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";
import type { Order } from "../types";

const SellerOrdersPage: React.FC = () => {
  const { API_URL } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/orders/seller`, { credentials: "include" });
        const data = await res.json();
        setOrders(data.orders || []);
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, []);

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  const statusColor: Record<string, string> = {
    pending: "bg-amber-50 text-amber-600 border border-amber-100",
    confirmed: "bg-blue-50 text-blue-600 border border-blue-100",
    delivered: "bg-emerald-50 text-emerald-600 border border-emerald-100",
    cancelled: "bg-red-50 text-red-500 border border-red-100",
  };

  if (loading) return <LoadingSpinner text="Loading orders..." />;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-extrabold text-slate-900 mb-8">Seller Orders</h1>

      <div className="flex gap-2 mb-8 overflow-x-auto pb-1">
        {["all", "pending", "confirmed", "delivered", "cancelled"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all duration-200 ${
              filter === s
                ? "bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-sm"
                : "bg-white border border-slate-200 text-slate-500 hover:border-brand-300 hover:text-brand-600"
            }`}
          >
            {s} {s !== "all" && `(${orders.filter((o) => o.status === s).length})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-slate-400 py-16 font-medium">No orders found</p>
      ) : (
        <div className="space-y-4">
          {filtered.map((order) => (
            <Link
              key={order._id}
              to={`/orders/${order._id}`}
              className="block bg-white border border-slate-100 rounded-2xl shadow-card p-5 hover:shadow-card-hover transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-800">Order #{order._id.slice(-8)}</span>
                  <span className="text-xs text-slate-400 ml-3">{new Date(order.createdAt).toLocaleDateString()}</span>
                  <p className="text-sm text-slate-400 mt-1">
                    {typeof order.buyer === "object" ? order.buyer.fullName : "Buyer"} — {order.items.length} item(s)
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-brand-600">৳{order.totalAmount}</span>
                  <span className={`block text-xs mt-1.5 px-2.5 py-1 rounded-full capitalize font-semibold inline-block ${statusColor[order.status] || "bg-slate-100"}`}>
                    {order.status}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default SellerOrdersPage;
