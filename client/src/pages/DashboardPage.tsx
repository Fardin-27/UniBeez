import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  const isSeller = user.role === "seller" || user.role === "admin";
  const isAdmin = user.role === "admin";

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-slate-900">Dashboard</h1>
        <p className="text-slate-400 mt-1">Welcome back, {user.fullName}</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Buyer links (always) */}
        <Link to="/marketplace" className="group bg-white rounded-2xl border border-slate-100 shadow-card p-6 hover:shadow-card-hover transition-all duration-300">
          <div className="w-11 h-11 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-xl flex items-center justify-center mb-4">
            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
          </div>
          <h3 className="font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">Browse Marketplace</h3>
          <p className="text-sm text-slate-400 mt-1">Find products to buy</p>
        </Link>

        <Link to="/profile" className="group bg-white rounded-2xl border border-slate-100 shadow-card p-6 hover:shadow-card-hover transition-all duration-300">
          <div className="w-11 h-11 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center mb-4">
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h3 className="font-bold text-slate-800 group-hover:text-slate-600 transition-colors">My Profile</h3>
          <p className="text-sm text-slate-400 mt-1">Edit your information</p>
        </Link>

        <Link to="/messages" className="group bg-white rounded-2xl border border-slate-100 shadow-card p-6 hover:shadow-card-hover transition-all duration-300">
          <div className="w-11 h-11 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-xl flex items-center justify-center mb-4">
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 4v-4z" />
            </svg>
          </div>
          <h3 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">Messages</h3>
          <p className="text-sm text-slate-400 mt-1">Chat before buying or booking</p>
        </Link>

        <Link to="/disputes" className="group bg-white rounded-2xl border border-slate-100 shadow-card p-6 hover:shadow-card-hover transition-all duration-300">
          <div className="w-11 h-11 bg-gradient-to-br from-amber-100 to-amber-200 rounded-xl flex items-center justify-center mb-4">
            <svg className="w-5 h-5 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h6m-1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
          </div>
          <h3 className="font-bold text-slate-800 group-hover:text-amber-700 transition-colors">Disputes</h3>
          <p className="text-sm text-slate-400 mt-1">Submit and track complaint resolution</p>
        </Link>

        {/* Seller links */}
        {isSeller && (
          <>
            <Link to="/seller/dashboard" className="group bg-white rounded-2xl border border-brand-100 shadow-card p-6 hover:shadow-card-hover transition-all duration-300">
              <div className="w-11 h-11 bg-gradient-to-br from-brand-100 to-brand-200 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="font-bold text-slate-800 group-hover:text-brand-600 transition-colors">Seller Dashboard</h3>
              <p className="text-sm text-slate-400 mt-1">Manage products & orders</p>
            </Link>
          </>
        )}

        {/* Admin link */}
        {isAdmin && (
          <Link to="/admin" className="group bg-white rounded-2xl border border-red-100 shadow-card p-6 hover:shadow-card-hover transition-all duration-300">
            <div className="w-11 h-11 bg-gradient-to-br from-red-100 to-red-200 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="font-bold text-slate-800 group-hover:text-red-600 transition-colors">Admin Panel</h3>
            <p className="text-sm text-slate-400 mt-1">System administration</p>
          </Link>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
