// Module: Authentication & User Management – developed by Member 1
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getImageUrl } from "../utils/imageUrl";

const ProfilePage: React.FC = () => {
  const { user, updateUser, API_URL } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: user?.fullName || "",
    bio: user?.bio || "",
    phone: user?.phone || "",
    department: user?.department || "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/users/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Update failed");
      updateUser(data.user);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) { navigate("/login"); return null; }

  const isAdmin = user.role === "admin";

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-extrabold text-slate-900 mb-8">My Profile</h1>

      {/* Info Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6 mb-6">
        <div className="flex items-center gap-4 mb-5">
          {user.avatar ? (
            <img
              src={getImageUrl(user.avatar)}
              alt={user.fullName}
              className="w-16 h-16 rounded-2xl object-cover"
            />
          ) : (
            <div className="w-16 h-16 bg-gradient-to-br from-brand-400 to-brand-600 rounded-2xl flex items-center justify-center">
              <span className="text-2xl font-bold text-white">
                {user.fullName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <h2 className="text-xl font-bold text-slate-900">{user.fullName}</h2>
            <p className="text-sm text-slate-400">@{user.username}</p>
            <div className="flex gap-2 mt-1.5">
              <span className="text-xs bg-brand-50 text-brand-700 px-2.5 py-0.5 rounded-full font-semibold capitalize">
                {user.role.replace(/_/g, " ")}
              </span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-slate-400 text-xs uppercase tracking-wider">Email</span>
            <p className="font-semibold text-slate-700 mt-0.5">{user.email}</p>
          </div>
          <div>
            <span className="text-slate-400 text-xs uppercase tracking-wider">Reputation</span>
            <p className="font-semibold text-slate-700 mt-0.5">{user.reputationScore?.toFixed(1) || "N/A"}</p>
          </div>
          <div>
            <span className="text-slate-400 text-xs uppercase tracking-wider">Transactions</span>
            <p className="font-semibold text-slate-700 mt-0.5">{user.totalCompletedTransactions || 0}</p>
          </div>
          <div>
            <span className="text-slate-400 text-xs uppercase tracking-wider">Member Since</span>
            <p className="font-semibold text-slate-700 mt-0.5">{new Date(user.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {isAdmin ? (
          <>
            {/* Admin Dashboard Card */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center">
                  <span className="text-lg">📊</span>
                </div>
                <h3 className="font-bold text-slate-900">Admin Dashboard</h3>
              </div>
              <p className="text-sm text-slate-600 mb-4">View platform analytics and overview</p>
              <button
                onClick={() => navigate("/admin")}
                className="w-full py-2 px-4 bg-brand-500 text-white rounded-lg font-semibold text-sm hover:bg-brand-600 transition-colors"
              >
                Go to Dashboard
              </button>
            </div>

            {/* Monitoring Card */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                  <span className="text-lg">🔍</span>
                </div>
                <h3 className="font-bold text-slate-900">Monitoring</h3>
              </div>
              <p className="text-sm text-slate-600 mb-4">Review alerts and suspicious activity</p>
              <button
                onClick={() => navigate("/admin/monitoring")}
                className="w-full py-2 px-4 bg-red-500 text-white rounded-lg font-semibold text-sm hover:bg-red-600 transition-colors"
              >
                View Alerts
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Selling Products Card */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <span className="text-lg">📦</span>
                </div>
                <h3 className="font-bold text-slate-900">Selling Products</h3>
              </div>
              <p className="text-sm text-slate-600 mb-4">Manage and list products for sale</p>
              <div className="flex gap-3">
                <button
                  onClick={() => navigate("/my-products")}
                  className="flex-1 py-2 px-4 bg-blue-50 text-blue-700 rounded-lg font-semibold text-sm hover:bg-blue-100 transition-colors"
                >
                  My Products
                </button>
                <button
                  onClick={() => navigate("/products/create")}
                  className="flex-1 py-2 px-4 bg-blue-500 text-white rounded-lg font-semibold text-sm hover:bg-blue-600 transition-colors"
                >
                  Create Product
                </button>
              </div>
            </div>

            {/* Skill Sharing Card */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                  <span className="text-lg">⭐</span>
                </div>
                <h3 className="font-bold text-slate-900">Skill Sharing</h3>
              </div>
              <p className="text-sm text-slate-600 mb-4">Share your skills and earn by teaching</p>
              <div className="flex gap-3">
                <button
                  onClick={() => navigate("/my-services")}
                  className="flex-1 py-2 px-4 bg-purple-50 text-purple-700 rounded-lg font-semibold text-sm hover:bg-purple-100 transition-colors"
                >
                  My Skills
                </button>
                <button
                  onClick={() => navigate("/services/create")}
                  className="flex-1 py-2 px-4 bg-purple-500 text-white rounded-lg font-semibold text-sm hover:bg-purple-600 transition-colors"
                >
                  Add Skill
                </button>
              </div>
            </div>
          </>
        )}

        {!isAdmin && (
          <>
            {/* Bookings Card */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                  <span className="text-lg">📅</span>
                </div>
                <h3 className="font-bold text-slate-900">My Bookings</h3>
              </div>
              <p className="text-sm text-slate-600 mb-4">View skills you've booked and manage them</p>
              <button
                onClick={() => navigate("/my-bookings")}
                className="w-full py-2 px-4 bg-green-500 text-white rounded-lg font-semibold text-sm hover:bg-green-600 transition-colors"
              >
                View Bookings
              </button>
            </div>

            {/* Service Requests Card */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                  <span className="text-lg">🔔</span>
                </div>
                <h3 className="font-bold text-slate-900">Service Requests</h3>
              </div>
              <p className="text-sm text-slate-600 mb-4">View and manage incoming skill requests</p>
              <button
                onClick={() => navigate("/service-bookings")}
                className="w-full py-2 px-4 bg-orange-500 text-white rounded-lg font-semibold text-sm hover:bg-orange-600 transition-colors"
              >
                View Requests
              </button>
            </div>
          </>
        )}
      </div>

      {/* Edit Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 shadow-card p-6 space-y-5">
        <h2 className="font-bold text-slate-800">Edit Profile</h2>

        {error && <div className="bg-red-50 text-red-600 text-sm p-4 rounded-2xl border border-red-100 font-medium">{error}</div>}
        {success && <div className="bg-emerald-50 text-emerald-600 text-sm p-4 rounded-2xl border border-emerald-100 font-medium">Profile updated!</div>}

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
          <input type="text" value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 focus:bg-white transition-all" />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Bio</label>
          <textarea value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 focus:bg-white transition-all"
            placeholder="Tell others about yourself..." />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Phone</label>
            <input type="text" value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 focus:bg-white transition-all" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Department</label>
            <input type="text" value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 focus:bg-white transition-all" />
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-brand-500 to-brand-600 text-white font-bold rounded-xl hover:from-brand-600 hover:to-brand-700 disabled:opacity-50 shadow-sm hover:shadow-glow transition-all duration-300 text-sm">
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
};

export default ProfilePage;
