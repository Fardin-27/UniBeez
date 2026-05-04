// Product & Transaction module
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import LoadingSpinner from "../components/LoadingSpinner";
import type { Product } from "../types";
import { getImageUrl } from "../utils/imageUrl";

const ProductDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, API_URL } = useAuth();
  const { addToCart, fetchCart, getCartQuantity } = useCart();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartError, setCartError] = useState("");
  const [messageText, setMessageText] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [messageError, setMessageError] = useState("");
  const [flagReason, setFlagReason] = useState("");
  const [isFlagging, setIsFlagging] = useState(false);
  const [flagStatus, setFlagStatus] = useState("");
  const [flagError, setFlagError] = useState("");

  useEffect(() => {
    fetchProduct();
    fetchCart();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const res = await fetch(`${API_URL}/api/products/${id}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setProduct(data.product);
      setFlagReason(data.product?.flagReason || "");
      setFlagStatus("");
      setFlagError("");
    } catch {
      navigate("/marketplace");
    } finally {
      setLoading(false);
    }
  };

  const handleFlagProduct = async () => {
    if (!product?._id) return;

    const nextReason = flagReason.trim() || "Flagged by admin";

    try {
      setIsFlagging(true);
      setFlagStatus("");
      setFlagError("");

      const response = await fetch(`${API_URL}/api/admin/flag/product/${product._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isFlagged: true, flagReason: nextReason }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Failed to flag product");
      }

      setProduct((current) => current
        ? { ...current, isFlagged: true, flagReason: nextReason }
        : current
      );
      setFlagReason(nextReason);
      setFlagStatus("Product marked as flagged");
    } catch (err) {
      setFlagError(err instanceof Error ? err.message : "Failed to flag product");
    } finally {
      setIsFlagging(false);
    }
  };

  const handleAddToCart = async () => {
    if (!user) { navigate("/login"); return; }
    setAddingToCart(true);
    setCartError("");
    try {
      await addToCart(product!._id);
    } catch (err: any) {
      setCartError(err.message || "Failed to add to cart");
    }
    setAddingToCart(false);
  };

  const handleSendMessage = async () => {
    const sellerId = seller?._id;

    if (!user) {
      navigate("/login");
      return;
    }

    if (!sellerId || !product?._id) {
      setMessageError("Seller details are not available yet");
      return;
    }

    if (!messageText.trim()) {
      setMessageError("Please write a message first");
      return;
    }

    try {
      setIsSendingMessage(true);
      setMessageError("");

      const response = await fetch(`${API_URL}/api/messages/conversations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          participantId: sellerId,
          contextType: "product",
          productId: product._id,
          message: messageText.trim(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Failed to send message");
      }

      setMessageText("");
      navigate("/messages");
    } catch (err) {
      setMessageError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setIsSendingMessage(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading product..." />;
  if (!product) return null;

  const seller = typeof product.seller === "object" ? product.seller : null;
  const cartQty = getCartQuantity(product._id);
  const stockReached = cartQty >= product.quantity;
  const isAdmin = user?.role === "admin";

  return (
    <div className="max-w-full px-4 py-10 bg-slate-50/30">
      <div className="grid lg:grid-cols-2 gap-10">
        {/* Images */}
        <div>
          <div className="aspect-square bg-slate-50 rounded-3xl overflow-hidden mb-4 border border-slate-100 shadow-card">
            {product.images && product.images.length > 0 ? (
              <img
                src={getImageUrl(product.images[selectedImage])}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-300">
                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
            )}
          </div>
          {product.images && product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`w-18 h-18 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all duration-200 ${
                    i === selectedImage ? "border-brand-500 shadow-glow" : "border-slate-200 hover:border-brand-300"
                  }`}
                >
                  <img src={getImageUrl(img)} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">{product.title}</h1>
              <p className="text-sm text-slate-400 capitalize mt-2">{product.category}</p>
            </div>
            <span className={`text-xs font-semibold px-3 py-1.5 rounded-lg shrink-0 ${
              product.productCondition === "new"
                ? "bg-emerald-50 text-emerald-600"
                : "bg-amber-50 text-amber-600"
            }`}>
              {product.productCondition === "new" ? "New" : "Used"}
            </span>
          </div>

          <div className="mt-6">
            <span className="text-4xl font-extrabold bg-gradient-to-r from-brand-500 to-brand-700 bg-clip-text text-transparent">৳{product.price}</span>
          </div>

          <p className="mt-6 text-slate-600 whitespace-pre-line leading-relaxed text-[15px]">{product.description}</p>

          <div className="mt-6">
            <span className={`inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg ${
              product.quantity > 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${product.quantity > 0 ? "bg-emerald-500" : "bg-red-500"}`} />
              {product.quantity > 0 ? `${product.quantity} in stock` : "Out of stock"}
            </span>
          </div>

          {seller && (
            <div className="mt-8 p-5 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-brand-400 to-brand-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-sm">{seller.fullName.charAt(0)}</span>
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{seller.fullName}</p>
                  {seller.reputationScore !== undefined && (
                    <p className="text-xs text-slate-400">Reputation: {seller.reputationScore.toFixed(1)} ⭐</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {isAdmin ? (
            <div className="mt-8 rounded-2xl border border-red-100 bg-red-50/70 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">Admin moderation</h4>
                </div>
                {product.isFlagged && (
                  <span className="shrink-0 rounded-lg bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-600">
                    Flagged
                  </span>
                )}
              </div>

              {flagError && (
                <div className="mt-4 bg-white text-red-600 text-sm p-3 rounded-xl border border-red-100 font-medium">
                  {flagError}
                </div>
              )}
              {flagStatus && (
                <div className="mt-4 bg-white text-emerald-600 text-sm p-3 rounded-xl border border-emerald-100 font-medium">
                  {flagStatus}
                </div>
              )}

              <label className="block text-sm font-semibold text-slate-700 mt-4 mb-2">
                Flag reason
              </label>
              <textarea
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                placeholder="Reason for flagging this product"
                rows={3}
                disabled={product.isFlagged}
                className="w-full px-3 py-2 border border-red-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-200 resize-none disabled:bg-white/60 disabled:text-slate-500"
              />
              <button
                type="button"
                onClick={handleFlagProduct}
                disabled={isFlagging || product.isFlagged}
                className="w-full mt-3 bg-red-600 text-white py-3 rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {product.isFlagged ? "Already flagged" : isFlagging ? "Flagging..." : "Mark as flagged"}
              </button>
            </div>
          ) : (
            <div className="mt-8">
              {cartError && (
                <div className="mb-3 bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-100 font-medium">
                  {cartError}
                </div>
              )}
              {stockReached && (
                <div className="mb-3 bg-amber-50 text-amber-600 text-sm p-3 rounded-xl border border-amber-100 font-medium">
                  Maximum stock reached
                </div>
              )}
              <button
                onClick={handleAddToCart}
                disabled={product.quantity <= 0 || addingToCart || stockReached || !!(user && seller && user._id === seller._id)}
                className="w-full py-4 bg-gradient-to-r from-brand-500 to-brand-600 text-white font-bold rounded-2xl hover:from-brand-600 hover:to-brand-700 disabled:opacity-50 shadow-sm hover:shadow-glow transition-all duration-300 text-sm"
              >
                {addingToCart ? "Adding..." : stockReached ? "Maximum stock reached" : "Add to Cart"}
              </button>

              <div className="mt-5 pt-5 border-t border-slate-200">
                <h4 className="text-sm font-semibold text-slate-800 mb-2">Send Message</h4>
                <p className="text-xs text-slate-500 mb-3">
                  Ask the seller a quick question before ordering.
                </p>
                {messageError && (
                  <div className="mb-3 bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-100 font-medium">
                    {messageError}
                  </div>
                )}
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Write a message to the seller..."
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                />
                <button
                  type="button"
                  onClick={handleSendMessage}
                  disabled={
                    isSendingMessage ||
                    !messageText.trim() ||
                    !seller?._id ||
                    seller?._id === user?._id
                  }
                  className="w-full mt-3 bg-slate-800 text-white py-2.5 rounded-xl font-semibold hover:bg-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {seller?._id === user?._id
                    ? "This is your product"
                    : isSendingMessage
                      ? "Sending..."
                      : "Send Message"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsPage;
