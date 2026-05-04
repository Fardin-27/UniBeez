import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "./AuthContext";
import type { Notification } from "../types";

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
};

const POLL_INTERVAL = 30_000; // 30 seconds

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, API_URL } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/notifications?limit=20`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.data ?? []);
        setUnreadCount(data.unreadCount ?? 0);
      }
    } catch {
      // silently ignore network errors during background polling
    } finally {
      setLoading(false);
    }
  }, [user, API_URL]);

  // Initial fetch + polling
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    fetchNotifications();
    intervalRef.current = setInterval(fetchNotifications, POLL_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [user, fetchNotifications]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/api/notifications/${id}/read`, {
        method: "PATCH",
        credentials: "include",
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch { /* ignore */ }
  }, [API_URL]);

  const markAllAsRead = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/notifications/read-all`, {
        method: "PATCH",
        credentials: "include",
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch { /* ignore */ }
  }, [API_URL]);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/api/notifications/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setNotifications((prev) => {
          const removed = prev.find((n) => n._id === id);
          if (removed && !removed.isRead) setUnreadCount((c) => Math.max(0, c - 1));
          return prev.filter((n) => n._id !== id);
        });
      }
    } catch { /* ignore */ }
  }, [API_URL]);

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, loading, fetchNotifications, markAsRead, markAllAsRead, deleteNotification }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
