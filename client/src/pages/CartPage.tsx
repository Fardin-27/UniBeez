// Product & Transaction module
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import LoadingSpinner from "../components/LoadingSpinner";
import { getImageUrl } from "../utils/imageUrl";

const CartPage: React.FC = () => {
  const { user, API_URL } = useAuth();
  const { items, removeFromCart, updateQuantity, clearCart, itemCount } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);

  const total = items.reduce((sum, item) => {
    const product = typeof item.product === "object" ? item.product : null;
    return sum + (product ? product.price * item.quantity : 0);
  }, 0);

  if (!user) {
    navigate("/login");
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-extrabold text-slate-900 mb-8">Shopping Cart</h1>

      {items.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-card">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
          </div>
          <p className="text-slate-400 text-lg font-medium">Your cart is empty</p>
          <Link to="/marketplace" className="mt-4 inline-flex items-center gap-2 text-brand-600 font-semibold hover:text-brand-700 transition-colors text-sm">
            Browse Marketplace
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const product = typeof item.product === "object" ? item.product : null;
            if (!product) return null;
            return (
              <div key={product._id} className="bg-white rounded-2xl border border-slate-100 shadow-card p-5 flex gap-5">
                <div className="w-24 h-24 bg-slate-50 rounded-xl overflow-hidden flex-shrink-0">
                  {product.images && product.images.length > 0 ? (
                    <img src={getImageUrl(product.images[0])} alt={product.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">No Image</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <Link to={`/products/${product._id}`} className="font-semibold text-slate-800 hover:text-brand-600 truncate block transition-colors">
                    {product.title}
                  </Link>
                  <p className="text-xs text-slate-400 capitalize mt-1">{product.category}</p>
                  <p className="text-lg font-extrabold text-brand-600 mt-2">৳{product.price}</p>
                </div>
                <div className="flex flex-col items-end justify-between">
                  <button
                    onClick={() => removeFromCart(product._id)}
                    className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateQuantity(product._id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      className="w-8 h-8 border border-slate-200 rounded-lg flex items-center justify-center disabled:opacity-30 hover:border-brand-300 hover:text-brand-600 text-slate-500 transition-all text-sm"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-semibold text-sm text-slate-700">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(product._id, item.quantity + 1)}
                      disabled={item.quantity >= product.quantity}
                      className="w-8 h-8 border border-slate-200 rounded-lg flex items-center justify-center disabled:opacity-30 hover:border-brand-300 hover:text-brand-600 text-slate-500 transition-all text-sm"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Summary */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-6">
            <div className="flex items-center justify-between mb-5">
              <span className="text-slate-500 font-medium">{itemCount} item(s)</span>
              <span className="text-2xl font-extrabold text-slate-900">৳{total.toFixed(2)}</span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={clearCart}
                className="px-5 py-3 border border-slate-200 rounded-xl font-semibold text-sm text-slate-600 hover:border-red-300 hover:text-red-500 hover:bg-red-50 transition-all"
              >
                Clear Cart
              </button>
              <Link
                to="/checkout"
                className="flex-1 py-3 bg-gradient-to-r from-brand-500 to-brand-600 text-white font-bold rounded-xl text-center hover:from-brand-600 hover:to-brand-700 shadow-sm hover:shadow-glow transition-all duration-300 text-sm"
              >
                Proceed to Checkout
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
