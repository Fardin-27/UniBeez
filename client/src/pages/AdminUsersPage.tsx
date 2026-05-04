// Admin & Feedback module
import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";
import type { User } from "../types";

const AdminUsersPage: React.FC = () => {
  const { API_URL } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  useEffect(() => { fetchUsers(); }, [page, roleFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (search) params.set("search", search);
      if (roleFilter !== "all") params.set("role", roleFilter);
      const res = await fetch(`${API_URL}/api/users?${params}`, { credentials: "include" });
      const data = await res.json();
      setUsers(data.users || []);
      setTotalPages(data.pagination?.pages || 1);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    }
    setLoading(false);
  };

  const toggleRestriction = async (targetUser: User) => {
    try {
      setUpdatingUserId(targetUser._id);
      setError("");
      const res = await fetch(`${API_URL}/api/users/${targetUser._id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isRestricted: !targetUser.isRestricted }),
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(users.map((u) => (u._id === targetUser._id ? data.user : u)));
      } else {
        throw new Error(data?.message || "Failed to update restriction");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update restriction");
    } finally {
      setUpdatingUserId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-extrabold text-slate-900 mb-8">Manage Users</h1>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5 mb-8 flex flex-col sm:flex-row gap-3">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users..."
          onKeyDown={(e) => e.key === "Enter" && (setPage(1), fetchUsers())}
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 focus:bg-white transition-all placeholder:text-slate-400" />
        <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 focus:bg-white transition-all">
          <option value="all">All Roles</option>
          <option value="buyer">Buyer</option>
          <option value="seller">Seller</option>
          <option value="admin">Admin</option>
        </select>
        <button onClick={() => { setPage(1); fetchUsers(); }}
          className="px-5 py-3 bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-xl font-bold text-sm hover:from-brand-600 hover:to-brand-700 shadow-sm hover:shadow-glow transition-all duration-300">
          Search
        </button>
      </div>

      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-100">
              <tr>
                <th className="text-left px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">User</th>
                <th className="text-left px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Email</th>
                <th className="text-left px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Roles</th>
                <th className="text-right px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Reputation</th>
                <th className="text-center px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Status</th>
                <th className="text-right px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-800">{u.fullName}</p>
                    <p className="text-xs text-slate-400">@{u.username}</p>
                  </td>
                  <td className="px-5 py-4 text-slate-500">{u.email}</td>
                  <td className="px-5 py-4">
                    <div className="flex gap-1 flex-wrap">
                      <span className="text-xs bg-brand-50 text-brand-700 px-2.5 py-0.5 rounded-full font-semibold capitalize">
                        {u.role.replace(/_/g, " ")}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right font-semibold text-slate-600">{u.reputationScore?.toFixed(1) || "—"}</td>
                  <td className="px-5 py-4 text-center">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                      u.isActive ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-red-50 text-red-500 border border-red-100"
                    }`}>
                      {u.isActive ? "Active" : "Inactive"}
                    </span>
                    {u.isRestricted && (
                      <span className="text-xs bg-amber-50 text-amber-600 border border-amber-100 px-2.5 py-1 rounded-full font-semibold ml-1">
                        Restricted
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button onClick={() => toggleRestriction(u)}
                      disabled={updatingUserId === u._id}
                      className={`text-xs font-semibold px-4 py-2 rounded-xl transition-all ${
                        u.isRestricted
                          ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100"
                          : "bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-100"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}>
                      {updatingUserId === u._id ? "Updating..." : u.isRestricted ? "Unrestrict" : "Restrict"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex justify-center gap-3 p-5 border-t border-slate-100">
              <button onClick={() => setPage(page - 1)} disabled={page <= 1}
                className="px-4 py-2 border border-slate-200 rounded-xl disabled:opacity-30 hover:border-brand-300 hover:text-brand-600 text-slate-500 text-sm font-medium transition-all">Previous</button>
              <span className="px-4 py-2 text-sm text-slate-400 font-medium">Page {page} of {totalPages}</span>
              <button onClick={() => setPage(page + 1)} disabled={page >= totalPages}
                className="px-4 py-2 border border-slate-200 rounded-xl disabled:opacity-30 hover:border-brand-300 hover:text-brand-600 text-slate-500 text-sm font-medium transition-all">Next</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
