// Admin & Feedback module
import React from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../context/NotificationContext";
import type { Notification } from "../types";

const iconMap: Record<string, string> = {
  message: "💬",
  booking_request: "📋",
  booking_approved: "✅",
  booking_rejected: "❌",
  booking_completed: "🎉",
  booking_cancelled: "🚫",
  order_placed: "🛍️",
  order_status: "📦",
  product_flagged: "!",
  product_unflagged: "i",
};

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification, fetchNotifications } =
    useNotifications();

  const handleClick = (n: Notification) => {
    if (!n.isRead) markAsRead(n._id);
    if (n.link) navigate(n.link);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-slate-500 mt-0.5">{unreadCount} unread</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-3 py-1.5 text-sm font-medium text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
            >
              Mark all read
            </button>
          )}
          <button
            onClick={fetchNotifications}
            disabled={loading}
            className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
            title="Refresh"
          >
            <svg className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Empty state */}
      {!loading && notifications.length === 0 && (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
          <div className="text-5xl mb-4">🔔</div>
          <h2 className="text-lg font-semibold text-slate-700">You're all caught up!</h2>
          <p className="text-slate-400 text-sm mt-1">
            New notifications for messages, bookings, and orders will appear here.
          </p>
        </div>
      )}

      {/* Notification list */}
      {notifications.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden divide-y divide-slate-50">
          {notifications.map((n) => (
            <div
              key={n._id}
              className={`flex items-start gap-4 px-5 py-4 transition-colors ${
                !n.isRead ? "bg-brand-50/30" : "hover:bg-slate-50"
              }`}
            >
              {/* Icon */}
              <span className="text-2xl mt-0.5 shrink-0">{iconMap[n.type] ?? "🔔"}</span>

              {/* Content — clickable */}
              <button
                onClick={() => handleClick(n)}
                className="flex-1 min-w-0 text-left"
              >
                <p className={`text-sm ${!n.isRead ? "font-semibold text-slate-800" : "font-medium text-slate-600"}`}>
                  {n.title}
                </p>
                <p className="text-sm text-slate-500 mt-0.5">{n.body}</p>
                <p className="text-xs text-slate-400 mt-1">{timeAgo(n.createdAt)}</p>
              </button>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                {!n.isRead && (
                  <button
                    onClick={() => markAsRead(n._id)}
                    title="Mark as read"
                    className="p-1.5 text-slate-300 hover:text-brand-500 hover:bg-brand-50 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={() => deleteNotification(n._id)}
                  title="Delete"
                  className="p-1.5 text-slate-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Unread dot */}
              {!n.isRead && (
                <span className="w-2 h-2 rounded-full bg-brand-500 shrink-0 mt-2" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
