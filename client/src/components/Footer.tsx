import React from "react";
import { Link } from "react-router-dom";

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 bg-gradient-to-br from-brand-400 to-brand-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-extrabold text-sm">U</span>
              </div>
              <span className="text-xl font-extrabold text-white">UniSphere</span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              Your campus marketplace — connecting students to buy, sell, and thrive together.
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Explore</h3>
            <ul className="space-y-3 text-sm">
              <li><Link to="/marketplace" className="hover:text-white transition-colors duration-200">Marketplace</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Account</h3>
            <ul className="space-y-3 text-sm">
              <li><Link to="/dashboard" className="hover:text-white transition-colors duration-200">Dashboard</Link></li>
              <li><Link to="/profile" className="hover:text-white transition-colors duration-200">Profile</Link></li>
              <li><Link to="/orders" className="hover:text-white transition-colors duration-200">Orders</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Support</h3>
            <ul className="space-y-3 text-sm">
              <li><Link to="/profile" className="hover:text-white transition-colors duration-200">Help Center</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-10 pt-8 text-center">
          <p className="text-sm text-slate-600">
            &copy; {new Date().getFullYear()} UniSphere &mdash; CSE471 System Analysis &amp; Design Project
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
