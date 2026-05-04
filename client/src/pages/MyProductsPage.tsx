import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";
import type { Product } from "../types";
import { getImageUrl } from "../utils/imageUrl";

const MyProductsPage: React.FC = () => {
  const { API_URL } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_URL}/api/products/my/listings`, { credentials: "include" });
      const data = await res.json();
      setProducts(data.products || []);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    try {
      await fetch(`${API_URL}/api/products/${id}`, { method: "DELETE", credentials: "include" });
      setProducts(products.filter((p) => p._id !== id));
    } catch { /* ignore */ }
  };

  if (loading) return <LoadingSpinner text="Loading products..." />;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900">My Products</h1>
        <Link to="/products/create" className="px-5 py-2.5 bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-xl font-bold text-sm hover:from-brand-600 hover:to-brand-700 shadow-sm hover:shadow-glow transition-all duration-300">
          + New Product
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-card">
          <p className="text-slate-400 text-lg font-medium">You haven&apos;t listed any products yet</p>
          <Link to="/products/create" className="mt-4 inline-flex items-center gap-2 text-brand-600 font-semibold hover:text-brand-700 transition-colors text-sm">
            Create your first listing
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-100">
              <tr>
                <th className="text-left px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Product</th>
                <th className="text-left px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Category</th>
                <th className="text-right px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Price</th>
                <th className="text-right px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Stock</th>
                <th className="text-right px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((p) => (
                <tr key={p._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-50 rounded-lg overflow-hidden flex-shrink-0">
                        {p.images && p.images.length > 0 ? (
                          <img src={getImageUrl(p.images[0])} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full" />
                        )}
                      </div>
                      <Link to={`/products/${p._id}`} className="font-semibold text-slate-800 hover:text-brand-600 truncate max-w-xs transition-colors">
                        {p.title}
                      </Link>
                    </div>
                  </td>
                  <td className="px-5 py-4 capitalize text-slate-500">{p.category}</td>
                  <td className="px-5 py-4 text-right font-bold text-brand-600">৳{p.price}</td>
                  <td className="px-5 py-4 text-right">
                    <span className={`font-semibold ${p.quantity > 0 ? "text-emerald-600" : "text-red-500"}`}>{p.quantity}</span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link to={`/products/${p._id}/edit`} className="text-brand-600 hover:text-brand-700 font-medium mr-3 transition-colors">Edit</Link>
                    <button onClick={() => deleteProduct(p._id)} className="text-red-400 hover:text-red-600 font-medium transition-colors">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MyProductsPage;
