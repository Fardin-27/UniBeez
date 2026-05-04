import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";
import type { Order } from "../types";

const SellerDashboard: React.FC = () => {
  const { user, API_URL } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState({ pending: 0, confirmed: 0, delivered: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/orders/seller`, { credentials: "include" });
        const data = await res.json();
        const list: Order[] = data.orders || [];
        setOrders(list);
        setStats({
          pending: list.filter((o) => o.status === "pending").length,
          confirmed: list.filter((o) => o.status === "confirmed").length,
          delivered: list.filter((o) => o.status === "delivered").length,
          revenue: list.filter((o) => o.status === "delivered").reduce((s, o) => s + o.totalAmount, 0),
        });
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, []);

  if (loading) return <LoadingSpinner text="Loading dashboard..." />;

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Seller Dashboard</h1>
          <p className="text-slate-400 mt-1">Welcome back, {user?.fullName}</p>
        </div>
        <Link to="/products/create" className="px-5 py-2.5 bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-xl font-bold text-sm hover:from-brand-600 hover:to-brand-700 shadow-sm hover:shadow-glow transition-all duration-300">
          + New Product
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-10">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Pending Orders</p>
          <p className="text-2xl font-extrabold text-amber-500 mt-2">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Confirmed</p>
          <p className="text-2xl font-extrabold text-blue-500 mt-2">{stats.confirmed}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Delivered</p>
          <p className="text-2xl font-extrabold text-emerald-500 mt-2">{stats.delivered}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Revenue</p>
          <p className="text-2xl font-extrabold text-brand-600 mt-2">৳{stats.revenue}</p>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card">
        <div className="p-6 border-b border-slate-100">
          <h2 className="font-bold text-slate-800">Recent Orders</h2>
        </div>
        {orders.length === 0 ? (
          <p className="p-6 text-center text-slate-400">No orders yet</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {orders.slice(0, 5).map((order) => (
              <Link key={order._id} to={`/orders/${order._id}`} className="p-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                <div>
                  <span className="text-sm font-semibold text-slate-700">Order #{order._id.slice(-8)}</span>
                  <span className="text-xs text-slate-400 ml-2">{new Date(order.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-brand-600">৳{order.totalAmount}</span>
                  <span className="text-xs capitalize px-2.5 py-1 rounded-full bg-slate-50 font-semibold text-slate-500">{order.status}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerDashboard;
