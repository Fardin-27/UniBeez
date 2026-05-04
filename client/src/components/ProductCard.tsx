import React from "react";
import { Link } from "react-router-dom";
import type { Product } from "../types";
import { getImageUrl } from "../utils/imageUrl";

interface Props {
  product: Product;
}

const ProductCard: React.FC<Props> = ({ product }) => {
  const seller = typeof product.seller === "object" ? product.seller : null;

  return (
    <Link to={`/products/${product._id}`} className="group block bg-white rounded-[2rem] shadow-card hover:shadow-2xl hover:-translate-y-1.5 border border-slate-100 transition-all duration-500 overflow-hidden">
      <div className="aspect-square bg-slate-50 overflow-hidden relative">
        {product.images && product.images.length > 0 ? (
          <img
            src={getImageUrl(product.images[0])}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        <span className={`absolute top-4 left-4 text-[10px] uppercase tracking-widest font-black px-3 py-1.5 rounded-full backdrop-blur-md shadow-sm ${
          product.productCondition === "new"
            ? "bg-emerald-500/80 text-white"
            : "bg-amber-500/80 text-white"
        }`}>
          {product.productCondition === "new" ? "New" : "Used"}
        </span>
      </div>
      <div className="p-5">
        <h3 className="font-bold text-slate-800 truncate group-hover:text-brand-600 transition-colors duration-200 text-lg">
          {product.title}
        </h3>
        <p className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider">{product.category}</p>
        <div className="flex items-center justify-between mt-4">
          <span className="text-xl font-black bg-gradient-to-r from-brand-600 to-indigo-600 bg-clip-text text-transparent">৳{product.price}</span>
          {seller && (
            <span className="text-[11px] font-medium text-slate-400 truncate ml-2 italic">
              by {seller.fullName}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
