import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";
import type { ActivityLog } from "../types";

const AdminActivityPage: React.FC = () => {
  const { API_URL } = useAuth();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => { fetchLogs(); }, [page]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/activity-logs?page=${page}&limit=25`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setTotalPages(data.pagination?.pages || 1);
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  const actionColor: Record<string, string> = {
    user_login: "bg-blue-50 text-blue-600 border border-blue-100",
    user_register: "bg-emerald-50 text-emerald-600 border border-emerald-100",
    product_created: "bg-brand-50 text-brand-700 border border-brand-100",
    product_updated: "bg-brand-50 text-brand-700 border border-brand-100",
    product_deleted: "bg-red-50 text-red-500 border border-red-100",
    order_placed: "bg-purple-50 text-purple-600 border border-purple-100",
    order_updated: "bg-purple-50 text-purple-600 border border-purple-100",
    user_restricted: "bg-red-50 text-red-500 border border-red-100",
  };

  if (loading) return <LoadingSpinner text="Loading activity logs..." />;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-extrabold text-slate-900 mb-8">Activity Logs</h1>

      {logs.length === 0 ? (
        <p className="text-center text-slate-400 py-16 font-medium">No activity logs found</p>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <div key={log._id} className="bg-white border border-slate-100 rounded-2xl shadow-card p-5 flex items-start gap-3">
              <span className={`text-xs px-2.5 py-1 rounded-full whitespace-nowrap font-semibold ${actionColor[log.action] || "bg-slate-50 text-slate-500 border border-slate-100"}`}>
                {log.action.replace(/_/g, " ")}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-700">{log.description}</p>
                <p className="text-xs text-slate-400 mt-1.5">
                  {typeof log.user === "object" ? log.user.fullName : "System"} — {new Date(log.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-3 mt-8">
          <button onClick={() => setPage(page - 1)} disabled={page <= 1}
            className="px-4 py-2.5 border border-slate-200 rounded-xl disabled:opacity-30 hover:border-brand-300 hover:text-brand-600 text-slate-500 text-sm font-medium transition-all">Previous</button>
          <span className="px-4 py-2.5 text-sm text-slate-400 font-medium">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(page + 1)} disabled={page >= totalPages}
            className="px-4 py-2.5 border border-slate-200 rounded-xl disabled:opacity-30 hover:border-brand-300 hover:text-brand-600 text-slate-500 text-sm font-medium transition-all">Next</button>
        </div>
      )}
    </div>
  );
};

export default AdminActivityPage;
