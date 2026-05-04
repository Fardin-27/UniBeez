import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const HomePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-700 via-brand-600 to-orange-400" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.04%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />
        <div className="relative max-w-7xl mx-auto px-4 py-28 sm:py-36">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 mb-8 shadow-sm">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-xs font-black text-white uppercase tracking-widest">Campus community is live</span>
            </div>
            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black tracking-tighter text-white drop-shadow-2xl">
              Uni<span className="text-[#d9fff7]">Sphere</span>
            </h1>
            <p className="mt-6 text-2xl sm:text-3xl font-bold text-white tracking-tight drop-shadow-lg">
              Where campus life connects.
            </p>
            <p className="mt-6 text-white/80 max-w-2xl mx-auto text-xl leading-relaxed font-medium">
              Unlock your potential. Buy, sell, and share skills with verified students in a trusted marketplace built for you.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/marketplace"
                className="inline-flex items-center justify-center px-8 py-3.5 bg-white text-brand-700 font-bold rounded-2xl hover:bg-brand-50 shadow-lg shadow-black/10 hover:shadow-xl transition-all duration-300 text-sm"
              >
                Browse Marketplace
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </Link>
              {!user && (
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center px-8 py-3.5 border-2 border-white/30 text-white font-bold rounded-2xl hover:bg-white/10 backdrop-blur-sm transition-all duration-300 text-sm"
                >
                  Get Started Free
                </Link>
              )}
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#f7fbfa]" />
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-extrabold text-slate-900">
            Everything Your Campus Needs
          </h2>
          <p className="mt-3 text-slate-500 max-w-lg mx-auto">Simple, fast, and built for students like you.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl p-8 shadow-card hover:shadow-card-hover border border-slate-100 transition-all duration-300 group">
            <div className="w-14 h-14 bg-gradient-to-br from-brand-100 to-brand-200 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-7 h-7 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900">Campus Marketplace</h3>
            <p className="mt-2 text-slate-500 text-sm leading-relaxed">
              Buy and sell textbooks, electronics, supplies, and more with fellow students at great prices.
            </p>
          </div>
          <div className="bg-white rounded-3xl p-8 shadow-card hover:shadow-card-hover border border-slate-100 transition-all duration-300 group">
            <div className="w-14 h-14 bg-gradient-to-br from-amber-100 to-amber-200 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-7 h-7 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" /></svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900">Easy Transactions</h3>
            <p className="mt-2 text-slate-500 text-sm leading-relaxed">
              Add items to your cart, checkout seamlessly, and track your orders from purchase to delivery.
            </p>
          </div>
          <div className="bg-white rounded-3xl p-8 shadow-card hover:shadow-card-hover border border-slate-100 transition-all duration-300 group">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900">Trusted Community</h3>
            <p className="mt-2 text-slate-500 text-sm leading-relaxed">
              Verified campus members and admin oversight ensure a safe, transparent experience.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      {!user && (
        <section className="py-20">
          <div className="max-w-4xl mx-auto px-4">
            <div className="bg-gradient-to-br from-brand-700 via-brand-500 to-[#ff9f6e] rounded-3xl p-12 text-center shadow-soft relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')]" />
              <div className="relative">
                <h2 className="text-3xl font-extrabold text-white">Ready to Join UniSphere?</h2>
                <p className="mt-3 text-white/70 text-lg">
                  Create your free account and start buying or selling today.
                </p>
                <div className="mt-8 flex gap-4 justify-center flex-col sm:flex-row">
                  <Link
                    to="/register"
                    className="px-8 py-3.5 bg-white text-brand-700 font-bold rounded-2xl hover:bg-brand-50 shadow-lg transition-all duration-300 text-sm"
                  >
                    Create Account
                  </Link>
                  <Link
                    to="/login"
                    className="px-8 py-3.5 border-2 border-white/30 text-white font-bold rounded-2xl hover:bg-white/10 transition-all duration-300 text-sm"
                  >
                    Sign In
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default HomePage;
