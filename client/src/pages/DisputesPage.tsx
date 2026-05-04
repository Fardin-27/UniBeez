// Admin & Feedback module
import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";

type Dispute = {
  _id: string;
  status: "Submitted" | "Under Review" | "Resolved" | "Rejected";
  transactionType: "order" | "booking";
  complaintType: string;
  description: string;
  createdAt: string;
  reporter?: { fullName?: string; username?: string };
  againstUser?: { fullName?: string; username?: string };
  adminResolution?: {
    action: "none" | "warning" | "refund";
    notes: string;
    refundAmount: number;
  };
};

const initialForm = {
  transactionType: "order",
  complaintType: "other",
  description: "",
};

const DisputesPage: React.FC = () => {
  const { API_URL, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [form, setForm] = useState(initialForm);
  const [statusFilter, setStatusFilter] = useState("all");
  const [error, setError] = useState<string | null>(null);

  const isAdmin = user?.role === "admin";

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);

      const endpoint = isAdmin ? "/api/disputes" : "/api/disputes/my";
      const response = await fetch(`${API_URL}${endpoint}?${params}`, {
        credentials: "include",
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.message || "Failed to load disputes");

      setDisputes(payload.disputes || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load disputes");
    } finally {
      setLoading(false);
    }
  };

  const submitDispute = async () => {
    if (!form.description.trim()) {
      setError("Description is required");
      return;
    }

    try {
      setSubmitting(true);
      const payload: Record<string, string> = {
        transactionType: form.transactionType,
        complaintType: form.complaintType,
        description: form.description,
      };

      const response = await fetch(`${API_URL}/api/disputes`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.message || "Failed to submit dispute");

      setForm(initialForm);
      await fetchDisputes();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit dispute");
    } finally {
      setSubmitting(false);
    }
  };

  const resolveDispute = async (
    id: string,
    status: "Under Review" | "Resolved" | "Rejected",
    action: "none" | "warning" | "refund"
  ) => {
    try {
      const response = await fetch(`${API_URL}/api/disputes/${id}/resolve`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, action }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.message || "Failed to resolve dispute");
      await fetchDisputes();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resolve dispute");
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, [statusFilter, isAdmin]);

  if (loading) return <LoadingSpinner text="Loading disputes..." />;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-slate-900">
          {isAdmin ? "Dispute Management" : "My Disputes"}
        </h1>
        <p className="text-slate-500 mt-1">
          {isAdmin
            ? "Review and resolve user complaints"
            : "Submit and track complaints linked to your transactions"}
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-600 text-sm">
          {error}
        </div>
      )}

      {!isAdmin && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-5 grid md:grid-cols-2 gap-3">
          <select
            value={form.transactionType}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, transactionType: event.target.value }))
            }
            className="border border-slate-300 rounded-xl px-3 py-2 text-sm"
          >
            <option value="order">Order</option>
            <option value="booking">Booking</option>
          </select>

          <select
            value={form.complaintType}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, complaintType: event.target.value }))
            }
            className="border border-slate-300 rounded-xl px-3 py-2 text-sm"
          >
            <option value="incomplete_service">Incomplete service</option>
            <option value="inaccurate_product_description">Inaccurate product description</option>
            <option value="delivery_failure">Delivery failure</option>
            <option value="payment_issue">Payment issue</option>
            <option value="other">Other</option>
          </select>

          <button
            onClick={submitDispute}
            disabled={submitting}
            className="bg-brand-600 text-white rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-60"
          >
            Submit Dispute
          </button>

          <textarea
            value={form.description}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, description: event.target.value }))
            }
            rows={3}
            className="md:col-span-2 border border-slate-300 rounded-xl px-3 py-2 text-sm"
            placeholder="Describe the issue clearly"
          />
        </div>
      )}

      <div className="mb-4 flex justify-end">
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="border border-slate-300 rounded-xl px-3 py-2 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="Submitted">Submitted</option>
          <option value="Under Review">Under Review</option>
          <option value="Resolved">Resolved</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      <div className="space-y-3">
        {disputes.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl px-4 py-5 text-slate-500 text-sm">
            No disputes found.
          </div>
        ) : (
          disputes.map((dispute) => (
            <div key={dispute._id} className="bg-white border border-slate-200 rounded-2xl p-4">
              <div className="flex flex-wrap gap-2 justify-between items-center mb-2">
                <p className="font-semibold text-slate-800 capitalize">
                  {dispute.complaintType.replace(/_/g, " ")}
                </p>
                <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold">
                  {dispute.status}
                </span>
              </div>
              <p className="text-sm text-slate-600 mb-2">{dispute.description}</p>
              <p className="text-xs text-slate-400">
                {dispute.transactionType.toUpperCase()} • {new Date(dispute.createdAt).toLocaleString()}
              </p>

              {isAdmin && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => resolveDispute(dispute._id, "Under Review", "none")}
                    className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700"
                  >
                    Mark Under Review
                  </button>
                  <button
                    onClick={() => resolveDispute(dispute._id, "Resolved", "warning")}
                    className="text-xs px-3 py-1.5 rounded-lg border border-amber-300 text-amber-700"
                  >
                    Resolve with Warning
                  </button>
                  <button
                    onClick={() => resolveDispute(dispute._id, "Resolved", "refund")}
                    className="text-xs px-3 py-1.5 rounded-lg border border-emerald-300 text-emerald-700"
                  >
                    Resolve with Refund
                  </button>
                  <button
                    onClick={() => resolveDispute(dispute._id, "Rejected", "none")}
                    className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DisputesPage;
