import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";

type MonitoringAlert = {
  _id: string;
  alertType: string;
  severity: "low" | "medium" | "high";
  description: string;
  status: "open" | "under_review" | "resolved" | "dismissed";
  createdAt: string;
  user?: {
    fullName?: string;
    username?: string;
    email?: string;
  };
};

const AdminMonitoringPage: React.FC = () => {
  const { API_URL } = useAuth();
  const [alerts, setAlerts] = useState<MonitoringAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningScan, setRunningScan] = useState(false);
  const [statusFilter, setStatusFilter] = useState("open");
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("status", statusFilter);
      const response = await fetch(
        `${API_URL}/api/admin/monitoring/alerts?${params.toString()}`,
        {
          credentials: "include",
        }
      );
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.message || "Failed to load monitoring alerts");

      setAlerts(payload.alerts || []);
      setError(null);
      setStatusMessage(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load monitoring alerts");
    } finally {
      setLoading(false);
    }
  };

  const runScan = async () => {
    try {
      setRunningScan(true);
      const response = await fetch(`${API_URL}/api/admin/monitoring/scan`, {
        method: "POST",
        credentials: "include",
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.message || "Failed to run monitoring scan");
      await fetchAlerts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run monitoring scan");
    } finally {
      setRunningScan(false);
    }
  };

  const updateStatus = async (
    id: string,
    status: "open" | "under_review" | "resolved" | "dismissed"
  ) => {
    try {
      setUpdatingStatusId(id);
      setError(null);
      setStatusMessage(null);
      const response = await fetch(`${API_URL}/api/admin/monitoring/alerts/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.message || "Failed to update alert status");

      const updatedAlert = payload.alert as MonitoringAlert;
      setAlerts((prev) => {
        const nextAlerts = prev.map((alert) =>
          alert._id === id ? { ...alert, ...updatedAlert, status } : alert
        );

        if (statusFilter !== "all" && status !== statusFilter) {
          return nextAlerts.filter((alert) => alert._id !== id);
        }

        return nextAlerts;
      });
      setStatusMessage(`Alert marked ${status.replace(/_/g, " ")}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update alert status");
    } finally {
      setUpdatingStatusId(null);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [statusFilter]);

  if (loading) return <LoadingSpinner text="Loading monitoring alerts..." />;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6 flex justify-between items-start gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Activity Monitoring</h1>
          <p className="text-slate-500 mt-1">
            Review automatically flagged unusual platform behavior
          </p>
        </div>
        <button
          onClick={runScan}
          disabled={runningScan}
          className="px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-semibold disabled:opacity-60"
        >
          {runningScan ? "Scanning..." : "Run Scan"}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-600 text-sm">
          {error}
        </div>
      )}
      {statusMessage && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700 text-sm">
          {statusMessage}
        </div>
      )}

      <div className="mb-4 flex justify-end">
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="border border-slate-300 rounded-xl px-3 py-2 text-sm"
        >
          <option value="open">Open</option>
          <option value="under_review">Under review</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
          <option value="all">All</option>
        </select>
      </div>

      <div className="space-y-3">
        {alerts.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl px-4 py-5 text-slate-500 text-sm">
            No monitoring alerts found.
          </div>
        ) : (
          alerts.map((alert) => (
            <div key={alert._id} className="bg-white border border-slate-200 rounded-2xl p-4">
              <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
                <p className="font-semibold text-slate-800 capitalize">
                  {alert.alertType.replace(/_/g, " ")}
                </p>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-semibold ${
                    alert.severity === "high"
                      ? "bg-red-100 text-red-600"
                      : alert.severity === "medium"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-blue-100 text-blue-600"
                  }`}
                >
                  {alert.severity}
                </span>
                <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold capitalize">
                  {alert.status.replace(/_/g, " ")}
                </span>
              </div>
              <p className="text-sm text-slate-600">{alert.description}</p>
              <p className="text-xs text-slate-400 mt-1">
                User: {alert.user?.fullName || alert.user?.username || "Unknown"} • {new Date(alert.createdAt).toLocaleString()}
              </p>

              <div className="mt-3 flex gap-2 flex-wrap">
                <button
                  onClick={() => updateStatus(alert._id, "under_review")}
                  disabled={updatingStatusId === alert._id || alert.status === "under_review"}
                  className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updatingStatusId === alert._id ? "Updating..." : "Under Review"}
                </button>
                <button
                  onClick={() => updateStatus(alert._id, "resolved")}
                  disabled={updatingStatusId === alert._id || alert.status === "resolved"}
                  className="text-xs px-3 py-1.5 rounded-lg border border-emerald-300 text-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Resolve
                </button>
                <button
                  onClick={() => updateStatus(alert._id, "dismissed")}
                  disabled={updatingStatusId === alert._id || alert.status === "dismissed"}
                  className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminMonitoringPage;
