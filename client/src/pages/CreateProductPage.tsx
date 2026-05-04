import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const categories = [
  "books", "electronics", "clothing", "stationery",
  "furniture", "sports", "food", "accessories", "other",
];

const CreateProductPage: React.FC = () => {
  const { API_URL } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    quantity: "1",
    category: "books",
    productCondition: "new",
  });
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      images.forEach((img) => formData.append("images", img));

      const res = await fetch(`${API_URL}/api/products`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create product");
      navigate("/my-products");
    } catch (err: any) {
      if (err.message === "Failed to fetch") {
        setError("Cannot connect to the server. Make sure the backend is running.");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [field]: e.target.value });

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-extrabold text-slate-900 mb-8">Create Product</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 shadow-card p-6 space-y-5">
        {error && <div className="bg-red-50 text-red-600 text-sm p-4 rounded-2xl border border-red-100 font-medium">{error}</div>}

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Title</label>
          <input type="text" required value={form.title} onChange={set("title")}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 focus:bg-white transition-all" />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description</label>
          <textarea required value={form.description} onChange={set("description")} rows={4}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 focus:bg-white transition-all" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Price (৳)</label>
            <input type="number" required min="0" step="0.01" value={form.price} onChange={set("price")}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 focus:bg-white transition-all" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Quantity</label>
            <input type="number" required min="1" value={form.quantity} onChange={set("quantity")}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 focus:bg-white transition-all" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Category</label>
            <select value={form.category} onChange={set("category")}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 focus:bg-white transition-all">
              {categories.map((c) => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Condition</label>
            <select value={form.productCondition} onChange={set("productCondition")}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 focus:bg-white transition-all">
              <option value="new">New</option>
              <option value="used">Used</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Images</label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            multiple
            onChange={(e) => setImages(Array.from(e.target.files || []))}
            className="w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:bg-brand-50 file:text-brand-700 file:font-semibold hover:file:bg-brand-100 file:transition-colors file:cursor-pointer"
          />
          {images.length > 0 && (
            <div className="flex gap-3 mt-3 flex-wrap">
              {images.map((file, i) => (
                <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                  <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                    className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors">&times;</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-brand-500 to-brand-600 text-white font-bold rounded-xl hover:from-brand-600 hover:to-brand-700 disabled:opacity-50 shadow-sm hover:shadow-glow transition-all duration-300 text-sm"
        >
          {loading ? "Creating..." : "Create Product"}
        </button>
      </form>
    </div>
  );
};

export default CreateProductPage;
