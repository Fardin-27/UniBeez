import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";

const AdminDashboard: React.FC = () => {
  const { API_URL } = useAuth();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/admin/analytics`, { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setAnalytics(data.analytics);
        }
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, []);

  if (loading) return <LoadingSpinner text="Loading analytics..." />;

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-extrabold text-slate-900 mb-10">Admin Dashboard</h1>

      {analytics && (
        <>
          {/* Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-10">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5">
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Users</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-2">{analytics.totalUsers}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5">
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Services</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-2">{analytics.totalServices || 0}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5">
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Orders</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-2">{analytics.totalOrders}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5">
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Monthly Volume</p>
              <p className="text-2xl font-extrabold text-brand-600 mt-2">৳{analytics.monthlyOrderVolume}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-10">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5">
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Bookings</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-2">{analytics.totalBookings || 0}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5">
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Booking Volume</p>
              <p className="text-2xl font-extrabold text-brand-600 mt-2">৳{analytics.monthlyBookingVolume || 0}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5">
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Open Alerts</p>
              <p className="text-2xl font-extrabold text-red-600 mt-2">{analytics.openMonitoringAlerts || 0}</p>
            </div>
          </div>

          {/* Top Sellers */}
          {analytics.topSellers?.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-card mb-8">
              <div className="p-6 border-b border-slate-100"><h2 className="font-bold text-slate-800">Top Sellers</h2></div>
              <div className="divide-y divide-slate-100">
                {analytics.topSellers.map((s: any, i: number) => (
                  <div key={i} className="p-5 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-800">{s.seller?.fullName || s.sellerName}</span>
                      <span className="text-sm text-slate-400 ml-2">{s.orderCount} orders</span>
                    </div>
                    <span className="font-extrabold text-brand-600">৳{s.totalSales}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Admin Links */}
      <div className="grid md:grid-cols-3 gap-5">
        <Link to="/admin/flagged" className="group bg-white rounded-2xl border border-slate-100 shadow-card p-6 hover:shadow-card-hover transition-all duration-300">
          <div className="w-11 h-11 bg-gradient-to-br from-red-100 to-red-200 rounded-xl flex items-center justify-center mb-4">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" /></svg>
          </div>
          <h3 className="font-bold text-slate-800 group-hover:text-red-600 transition-colors">Flagged Content</h3>
          <p className="text-sm text-slate-400 mt-1">Review flagged products</p>
        </Link>
        <Link to="/admin/users" className="group bg-white rounded-2xl border border-slate-100 shadow-card p-6 hover:shadow-card-hover transition-all duration-300">
          <div className="w-11 h-11 bg-gradient-to-br from-brand-100 to-brand-200 rounded-xl flex items-center justify-center mb-4">
            <svg className="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          </div>
          <h3 className="font-bold text-slate-800 group-hover:text-brand-600 transition-colors">Manage Users</h3>
          <p className="text-sm text-slate-400 mt-1">View and manage all users</p>
        </Link>
        <Link to="/admin/activity" className="group bg-white rounded-2xl border border-slate-100 shadow-card p-6 hover:shadow-card-hover transition-all duration-300">
          <div className="w-11 h-11 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-xl flex items-center justify-center mb-4">
            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
          </div>
          <h3 className="font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">Activity Logs</h3>
          <p className="text-sm text-slate-400 mt-1">View system activity logs</p>
        </Link>
        <Link to="/disputes" className="group bg-white rounded-2xl border border-slate-100 shadow-card p-6 hover:shadow-card-hover transition-all duration-300">
          <div className="w-11 h-11 bg-gradient-to-br from-amber-100 to-amber-200 rounded-xl flex items-center justify-center mb-4">
            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h6m-1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
          </div>
          <h3 className="font-bold text-slate-800 group-hover:text-amber-600 transition-colors">Disputes</h3>
          <p className="text-sm text-slate-400 mt-1">Resolve complaints with warnings/refunds/restrictions</p>
        </Link>
        <Link to="/admin/monitoring" className="group bg-white rounded-2xl border border-slate-100 shadow-card p-6 hover:shadow-card-hover transition-all duration-300">
          <div className="w-11 h-11 bg-gradient-to-br from-red-100 to-red-200 rounded-xl flex items-center justify-center mb-4">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4V7m5 10V5a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2z" /></svg>
          </div>
          <h3 className="font-bold text-slate-800 group-hover:text-red-600 transition-colors">Monitoring Alerts</h3>
          <p className="text-sm text-slate-400 mt-1">Automated anomaly detection and review queue</p>
        </Link>
      </div>

      {/* Log Out Button */}
      <div className="mt-10 text-center">
        <button
          onClick={() => {
            const { logout } = useAuth();
            logout();
          }}
          className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-all duration-300"
        >
          Log Out
        </button>
      </div>
    </div>
  );
};

export default AdminDashboard;
