import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useNotifications } from "../context/NotificationContext";
import type { Notification } from "../types";

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleNotifClick = (n: Notification) => {
    if (!n.isRead) markAsRead(n._id);
    setNotifOpen(false);
    if (n.link) navigate(n.link);
  };

  const notifIconMap: Record<string, string> = {
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

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white/80 backdrop-blur-lg border-b border-slate-200/60 sticky top-0 z-50">
      <div className="max-w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 via-brand-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-md group-hover:shadow-indigo-500/25 group-hover:scale-105 transition-all duration-300">
                <span className="text-white font-black text-base tracking-tight">U</span>
              </div>
              <span className="text-2xl font-black bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-700 bg-clip-text text-transparent tracking-tight">
                UniSphere
              </span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              to="/marketplace"
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive("/marketplace")
                  ? "bg-brand-50 text-brand-700"
                  : "text-slate-600 hover:text-brand-600 hover:bg-brand-50/50"
              }`}
            >
              Marketplace
            </Link>

            <Link
              to="/services"
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive("/services")
                  ? "bg-brand-50 text-brand-700"
                  : "text-slate-600 hover:text-brand-600 hover:bg-brand-50/50"
              }`}
            >
              Skills
            </Link>

            {user && (
              <Link
                to="/messages"
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive("/messages")
                    ? "bg-brand-50 text-brand-700"
                    : "text-slate-600 hover:text-brand-600 hover:bg-brand-50/50"
                }`}
              >
                Messages
              </Link>
            )}

            {user ? (
              <div className="flex items-center gap-2 ml-2">
                {/* Cart */}
                {user.role !== "admin" && (
                  <Link
                    to="/cart"
                    className={`relative p-2.5 rounded-xl transition-all duration-200 ${
                      isActive("/cart") ? "bg-brand-50 text-brand-600" : "text-slate-500 hover:text-brand-600 hover:bg-brand-50/50"
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                    </svg>
                    {itemCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 bg-gradient-to-r from-brand-500 to-brand-600 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-sm">
                        {itemCount > 9 ? "9+" : itemCount}
                      </span>
                    )}
                  </Link>
                )}

                {/* Notification Bell */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setNotifOpen(!notifOpen)}
                    className={`relative p-2.5 rounded-xl transition-all duration-200 ${
                      notifOpen ? "bg-brand-50 text-brand-600" : "text-slate-500 hover:text-brand-600 hover:bg-brand-50/50"
                    }`}
                    aria-label="Notifications"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-sm">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>

                  {notifOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-lg border border-slate-100 z-50 animate-in fade-in slide-in-from-top-2 overflow-hidden">
                      {/* Header */}
                      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                        <span className="text-sm font-semibold text-slate-800">Notifications</span>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>

                      {/* List */}
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="px-4 py-8 text-center">
                            <div className="text-3xl mb-2">🔔</div>
                            <p className="text-sm text-slate-400">No notifications yet</p>
                          </div>
                        ) : (
                          notifications.slice(0, 8).map((n) => (
                            <button
                              key={n._id}
                              onClick={() => handleNotifClick(n)}
                              className={`w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 ${
                                !n.isRead ? "bg-brand-50/40" : ""
                              }`}
                            >
                              <span className="text-xl mt-0.5 shrink-0">{notifIconMap[n.type] ?? "🔔"}</span>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm ${!n.isRead ? "font-semibold text-slate-800" : "font-medium text-slate-600"} truncate`}>
                                  {n.title}
                                </p>
                                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.body}</p>
                                <p className="text-[11px] text-slate-400 mt-1">{timeAgo(n.createdAt)}</p>
                              </div>
                              {!n.isRead && (
                                <span className="w-2 h-2 rounded-full bg-brand-500 shrink-0 mt-1.5" />
                              )}
                            </button>
                          ))
                        )}
                      </div>

                      {/* Footer */}
                      {notifications.length > 0 && (
                        <div className="px-4 py-2.5 border-t border-slate-100">
                          <Link
                            to="/notifications"
                            onClick={() => setNotifOpen(false)}
                            className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                          >
                            View all notifications →
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Profile Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-brand-50/50 transition-all duration-200"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-brand-400 to-brand-600 rounded-lg flex items-center justify-center shadow-sm">
                      <span className="text-white font-bold text-xs">
                        {user.fullName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-slate-700">{user.fullName.split(" ")[0]}</span>
                    <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-lg border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                      <div className="px-4 py-2 border-b border-slate-100 mb-1">
                        <p className="text-sm font-semibold text-slate-800">{user.fullName}</p>
                        <p className="text-xs text-slate-400">{user.email}</p>
                      </div>
                      <Link to="/dashboard" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-brand-50 hover:text-brand-700 transition-colors" onClick={() => setProfileOpen(false)}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                        Dashboard
                      </Link>
                      <Link to="/profile" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-brand-50 hover:text-brand-700 transition-colors" onClick={() => setProfileOpen(false)}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        Profile
                      </Link>
                      {user.role !== "admin" && (
                        <>
                          <Link to="/orders" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-brand-50 hover:text-brand-700 transition-colors" onClick={() => setProfileOpen(false)}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                            My Orders
                          </Link>
                          <Link to="/my-bookings" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-brand-50 hover:text-brand-700 transition-colors" onClick={() => setProfileOpen(false)}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            My Bookings
                          </Link>
                          <Link to="/activity-history" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-brand-50 hover:text-brand-700 transition-colors" onClick={() => setProfileOpen(false)}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12h4l3 8 4-16 3 8h4" /></svg>
                            Activity History
                          </Link>
                        </>
                      )}
                      <Link to="/disputes" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-brand-50 hover:text-brand-700 transition-colors" onClick={() => setProfileOpen(false)}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 8h10M7 12h6m-1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
                        Disputes
                      </Link>
                      <Link to="/messages" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-brand-50 hover:text-brand-700 transition-colors" onClick={() => setProfileOpen(false)}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 4v-4z" /></svg>
                        Messages
                      </Link>

                      {user.role === "seller" && (
                        <>
                          <div className="h-px bg-slate-100 my-1" />
                          <Link to="/my-products" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-brand-50 hover:text-brand-700 transition-colors" onClick={() => setProfileOpen(false)}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                            My Products
                          </Link>
                          <Link to="/seller/orders" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-brand-50 hover:text-brand-700 transition-colors" onClick={() => setProfileOpen(false)}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                            Seller Orders
                          </Link>
                          <div className="h-px bg-slate-100 my-1" />
                          <Link to="/my-services" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-brand-50 hover:text-brand-700 transition-colors" onClick={() => setProfileOpen(false)}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            My Skills
                          </Link>
                          <Link to="/services/create" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-brand-50 hover:text-brand-700 transition-colors" onClick={() => setProfileOpen(false)}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4v16m8-8H4" /></svg>
                            Add Skill
                          </Link>
                          <Link to="/service-bookings" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-brand-50 hover:text-brand-700 transition-colors" onClick={() => setProfileOpen(false)}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            Skill Requests
                          </Link>
                        </>
                      )}

                      {user.role === "admin" && (
                        <>
                          <div className="h-px bg-slate-100 my-1" />
                          <Link to="/admin" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-brand-50 hover:text-brand-700 transition-colors" onClick={() => setProfileOpen(false)}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            Admin Panel
                          </Link>
                          <Link to="/admin/monitoring" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-brand-50 hover:text-brand-700 transition-colors" onClick={() => setProfileOpen(false)}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 17v-2m3 2v-4m3 4V7m5 10V5a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2z" /></svg>
                            Monitoring
                          </Link>
                        </>
                      )}

                      <div className="h-px bg-slate-100 my-1" />
                      <button
                        onClick={() => { setProfileOpen(false); handleLogout(); }}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 ml-2">
                <Link to="/login" className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-brand-600 rounded-xl hover:bg-brand-50/50 transition-all duration-200">
                  Sign in
                </Link>
                <Link to="/register" className="px-5 py-2.5 bg-gradient-to-r from-brand-500 to-brand-600 text-white text-sm font-semibold rounded-xl hover:from-brand-600 hover:to-brand-700 shadow-sm hover:shadow-glow transition-all duration-300">
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 rounded-xl text-slate-500 hover:bg-brand-50 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white/95 backdrop-blur-lg">
          <div className="px-4 py-4 space-y-1">
            <Link to="/marketplace" className="block px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-colors" onClick={() => setMenuOpen(false)}>Marketplace</Link>
            <Link to="/services" className="block px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-colors" onClick={() => setMenuOpen(false)}>Skills</Link>
            {user ? (
              <>
                <Link to="/dashboard" className="block px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-colors" onClick={() => setMenuOpen(false)}>Dashboard</Link>
                {user.role !== "admin" && (
                  <Link to="/cart" className="block px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-colors" onClick={() => setMenuOpen(false)}>Cart ({itemCount})</Link>
                )}
                {user.role !== "admin" && (
                  <>
                    <Link to="/orders" className="block px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-colors" onClick={() => setMenuOpen(false)}>My Orders</Link>
                    <Link to="/my-bookings" className="block px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-colors" onClick={() => setMenuOpen(false)}>My Bookings</Link>
                    <Link to="/activity-history" className="block px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-colors" onClick={() => setMenuOpen(false)}>Activity History</Link>
                  </>
                )}
                <Link to="/messages" className="block px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-colors" onClick={() => setMenuOpen(false)}>Messages</Link>
                <Link to="/disputes" className="block px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-colors" onClick={() => setMenuOpen(false)}>Disputes</Link>
                {user.role === "seller" && (
                  <>
                    <div className="h-px bg-slate-100 my-2" />
                    <Link to="/my-services" className="block px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-colors" onClick={() => setMenuOpen(false)}>My Skills</Link>
                    <Link to="/services/create" className="block px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-colors" onClick={() => setMenuOpen(false)}>Add Skill</Link>
                    <Link to="/service-bookings" className="block px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-colors" onClick={() => setMenuOpen(false)}>Skill Requests</Link>
                  </>
                )}
                <div className="h-px bg-slate-100 my-2" />
                <button onClick={() => { setMenuOpen(false); handleLogout(); }} className="block w-full text-left px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 rounded-xl transition-colors">Sign out</button>
              </>
            ) : (
              <>
                <Link to="/login" className="block px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-colors" onClick={() => setMenuOpen(false)}>Sign in</Link>
                <Link to="/register" className="block px-4 py-2.5 text-sm font-semibold text-brand-600 hover:bg-brand-50 rounded-xl transition-colors" onClick={() => setMenuOpen(false)}>Get Started</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
