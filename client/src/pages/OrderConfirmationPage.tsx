import React from "react";
import { Link, useLocation } from "react-router-dom";

const OrderConfirmationPage: React.FC = () => {
  const location = useLocation();
  const orders = location.state?.orders || [];

  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg">
        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 className="text-3xl font-extrabold text-slate-900">Order Placed!</h1>
      <p className="text-slate-400 mt-3 text-lg">
        Your order{orders.length > 1 ? "s have" : " has"} been placed successfully.
      </p>

      {orders.length > 0 && (
        <div className="mt-8 space-y-3">
          {orders.map((order: any, i: number) => (
            <div key={order._id || i} className="bg-white border border-slate-100 rounded-2xl shadow-card p-5 text-left">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Order #{order._id?.slice(-8)}</span>
                <span className="font-bold text-brand-600">৳{order.totalAmount}</span>
              </div>
              <p className="text-xs text-slate-400 mt-1.5">{order.items?.length || 0} item(s)</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-10 flex gap-4 justify-center flex-col sm:flex-row">
        <Link
          to="/orders"
          className="px-8 py-3 bg-gradient-to-r from-brand-500 to-brand-600 text-white font-bold rounded-xl hover:from-brand-600 hover:to-brand-700 shadow-sm hover:shadow-glow transition-all duration-300 text-sm"
        >
          View Orders
        </Link>
        <Link
          to="/marketplace"
          className="px-8 py-3 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-all text-sm"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
};

export default OrderConfirmationPage;
