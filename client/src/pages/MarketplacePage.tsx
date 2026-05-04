import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import ProductCard from "../components/ProductCard";
import LoadingSpinner from "../components/LoadingSpinner";
import type { Product } from "../types";

const categories = [
  "all",
  "books",
  "electronics",
  "clothing",
  "stationery",
  "furniture",
  "sports",
  "food",
  "accessories",
  "other",
];

const categoryIcons: Record<string, string> = {
  all: "🌟", books: "📚", electronics: "📱", clothing: "👕",
  stationery: "✏️", furniture: "🪑", sports: "⚽", food: "🍜",
  accessories: "🎒", other: "📦",
};

const MarketplacePage: React.FC = () => {
  const { API_URL } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [condition, setCondition] = useState("all");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchProducts();
  }, [category, condition, sort, page]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "12", sort });
      if (search) params.set("search", search);
      if (category !== "all") params.set("category", category);
      if (condition !== "all") params.set("condition", condition);

      const res = await fetch(`${API_URL}/api/products?${params}`);
      const data = await res.json();
      setProducts(data.products || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  return (
    <div className="max-w-full px-4 py-8">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight bg-gradient-to-r from-brand-600 to-indigo-600 bg-clip-text text-transparent inline-block">Marketplace</h1>
        <p className="text-slate-500 mt-2 text-lg font-medium">Unique products from your campus community</p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search for anything..."
            className="w-full bg-white/80 backdrop-blur-md border border-white/40 rounded-2xl pl-12 pr-24 py-3.5 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 transition-shadow shadow-card placeholder:text-slate-400"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2 bg-gradient-to-r from-brand-500 to-brand-600 text-white text-sm font-semibold rounded-xl hover:from-brand-600 hover:to-brand-700 transition-all shadow-sm"
          >
            Search
          </button>
        </div>
      </form>

      {/* Category Pills */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => { setCategory(c); setPage(1); }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${
              category === c
                ? "bg-brand-600 text-white shadow-sm"
                : "bg-white/80 backdrop-blur-sm text-slate-600 border border-white/40 hover:border-brand-300 hover:text-brand-600"
            }`}
          >
            <span>{categoryIcons[c]}</span>
            {c === "all" ? "All" : c.charAt(0).toUpperCase() + c.slice(1)}
          </button>
        ))}
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap gap-3 mb-8">
        <select
          value={condition}
          onChange={(e) => { setCondition(e.target.value); setPage(1); }}
          className="bg-white border border-slate-200 rounded-xl pl-4 pr-9 py-2.5 text-sm text-slate-600 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400"
        >
          <option value="all">Any Condition</option>
          <option value="new">New</option>
          <option value="used">Used</option>
        </select>
        <select
          value={sort}
          onChange={(e) => { setSort(e.target.value); setPage(1); }}
          className="bg-white border border-slate-200 rounded-xl pl-4 pr-9 py-2.5 text-sm text-slate-600 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400"
        >
          <option value="newest">Newest First</option>
          <option value="price_low">Price: Low to High</option>
          <option value="price_high">Price: High to Low</option>
        </select>
      </div>

      {/* Products Grid */}
      {loading ? (
        <LoadingSpinner text="Loading products..." />
      ) : products.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <p className="text-slate-400 text-lg font-medium">No products found</p>
          <p className="text-slate-400 text-sm mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {products.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-3 mt-10">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 disabled:opacity-40 hover:border-brand-300 hover:text-brand-600 transition-all"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm font-medium text-slate-500">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
                className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 disabled:opacity-40 hover:border-brand-300 hover:text-brand-600 transition-all"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MarketplacePage;
