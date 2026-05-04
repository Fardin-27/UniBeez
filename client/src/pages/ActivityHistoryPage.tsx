import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";

type ActivityRecord = {
  id: string;
  recordType: string;
  status: string;
  amount: number | null;
  transactionType: string;
  createdAt: string;
  counterpart?: {
    fullName?: string;
    username?: string;
  };
  metadata?: Record<string, unknown>;
};

const ActivityHistoryPage: React.FC = () => {
  const { API_URL } = useAuth();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<ActivityRecord[]>([]);
  const [pending, setPending] = useState<{
    pendingOrderSales: number;
    pendingServiceRequests: number;
    unreadMessages: number;
  } | null>(null);
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("type", type);
      params.set("status", status);

      const response = await fetch(`${API_URL}/api/activity/history?${params.toString()}`, {
        credentials: "include",
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.message || "Failed to load activity history");

      setRecords(payload.records || []);
      setPending(payload.pendingInteractions || null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load activity history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [type, status]);

  if (loading) return <LoadingSpinner text="Loading activity history..." />;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-slate-900">Activity History</h1>
        <p className="text-slate-500 mt-1">
          Review your purchases, sales, bookings, statuses, and pending interactions
        </p>
      </div>

      {pending && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-xs text-slate-400 uppercase">Pending Sales</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{pending.pendingOrderSales}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-xs text-slate-400 uppercase">Pending Service Requests</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{pending.pendingServiceRequests}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-xs text-slate-400 uppercase">Unread Messages</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{pending.unreadMessages}</p>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-4 flex flex-wrap gap-3">
        <select
          value={type}
          onChange={(event) => setType(event.target.value)}
          className="border border-slate-300 rounded-xl px-3 py-2 text-sm"
        >
          <option value="all">All types</option>
          <option value="product_purchase">Product purchases</option>
          <option value="product_sale">Product sales</option>
          <option value="service_booking">Service bookings</option>
          <option value="service_session">Service sessions</option>
          <option value="dispute">Disputes</option>
        </select>

        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="border border-slate-300 rounded-xl px-3 py-2 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="confirmed">Confirmed</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
          <option value="requested">Requested</option>
          <option value="approved">Approved</option>
          <option value="completed">Completed</option>
          <option value="Submitted">Submitted</option>
          <option value="Under Review">Under Review</option>
          <option value="Resolved">Resolved</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-600 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left px-4 py-3">Type</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Counterpart</th>
                <th className="text-left px-4 py-3">Amount</th>
                <th className="text-left px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                    No records found for the selected filters.
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record.id}>
                    <td className="px-4 py-3 capitalize">{record.recordType.replace(/_/g, " ")}</td>
                    <td className="px-4 py-3">{record.status}</td>
                    <td className="px-4 py-3">
                      {record.counterpart?.fullName || record.counterpart?.username || "-"}
                    </td>
                    <td className="px-4 py-3">
                      {typeof record.amount === "number" ? `৳${record.amount}` : "-"}
                    </td>
                    <td className="px-4 py-3">{new Date(record.createdAt).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ActivityHistoryPage;
